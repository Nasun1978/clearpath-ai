// Field-level AES-256-GCM encryption with per-user key derivation.
// Each user's key is derived from a shared master key + their user ID via HKDF,
// so a compromised row is useless without the master key from the env.
//
// Ciphertext format: "enc:v1:<base64(iv[12] || authTag[16] || ciphertext)>"
// Plain fields (no prefix) pass through unchanged — backward-compatible.

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  hkdfSync,
  randomBytes,
} from "crypto";

const ALGO = "aes-256-gcm";
const IV_BYTES = 12;
const TAG_BYTES = 16;
const KEY_BYTES = 32;
const PREFIX = "enc:v1:";
const INFO = "ripespot-field-encryption-v1";

// ── Master key ────────────────────────────────────────────────────────────────

function getMasterKey(): Buffer {
  const raw = process.env.ENCRYPTION_MASTER_KEY;
  if (!raw) throw new Error("ENCRYPTION_MASTER_KEY is not set");
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32)
    throw new Error("ENCRYPTION_MASTER_KEY must be 64 hex characters (32 bytes)");
  return buf;
}

// ── Key derivation ────────────────────────────────────────────────────────────

// Derives a unique 256-bit key for a specific user.
// Admin can reproduce any user's key because they hold the master.
export function deriveUserKey(userId: string): Buffer {
  const master = getMasterKey();
  return Buffer.from(hkdfSync("sha256", master, userId, INFO, KEY_BYTES));
}

// Returns the SHA-256 fingerprint of the master key (safe to display in UI).
export function masterKeyFingerprint(): string {
  return createHash("sha256").update(getMasterKey()).digest("hex").slice(0, 16);
}

// ── Core encrypt / decrypt ────────────────────────────────────────────────────

export function encryptField(plaintext: string, userId: string): string {
  const key = deriveUserKey(userId);
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGO, key, iv);
  const body = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return PREFIX + Buffer.concat([iv, tag, body]).toString("base64");
}

// Returns plaintext. If the value is not prefixed, returns it unchanged.
// Throws on authentication failure (tampered ciphertext).
export function decryptField(value: string, userId: string): string {
  if (!value.startsWith(PREFIX)) return value;
  const payload = Buffer.from(value.slice(PREFIX.length), "base64");
  const iv = payload.subarray(0, IV_BYTES);
  const tag = payload.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
  const body = payload.subarray(IV_BYTES + TAG_BYTES);
  const key = deriveUserKey(userId);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(body), decipher.final()]).toString("utf8");
}

export function isEncrypted(value: unknown): boolean {
  return typeof value === "string" && value.startsWith(PREFIX);
}

// ── Bulk helpers (used in API routes) ────────────────────────────────────────

// Encrypts the named string fields in-place on a copy of the object.
export function encryptFields<T extends object>(
  obj: T,
  userId: string,
  fields: (keyof T)[]
): T {
  const out = { ...obj } as Record<string, unknown>;
  for (const f of fields) {
    const v = out[f as string];
    if (typeof v === "string" && v.length > 0 && !isEncrypted(v)) {
      out[f as string] = encryptField(v, userId);
    }
  }
  return out as T;
}

// Decrypts the named string fields in-place on a copy of the object.
// Silently replaces any field that fails authentication with "[decryption error]".
export function decryptFields<T extends object>(
  obj: T,
  userId: string,
  fields: (keyof T)[]
): T {
  const out = { ...obj } as Record<string, unknown>;
  for (const f of fields) {
    const v = out[f as string];
    if (typeof v === "string" && isEncrypted(v)) {
      try {
        out[f as string] = decryptField(v, userId);
      } catch {
        out[f as string] = "[decryption error]";
      }
    }
  }
  return out as T;
}

// Decrypt an array of records — convenience wrapper for GET responses.
export function decryptRecords<T extends object>(
  records: T[],
  userId: string,
  fields: (keyof T)[]
): T[] {
  return records.map((r) => decryptFields(r, userId, fields));
}
