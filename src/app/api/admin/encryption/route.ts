import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import { masterKeyFingerprint } from "@/lib/encryption";

const ADMIN_EMAIL = "stevenkennedy78@gmail.com";

export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user || user.email !== ADMIN_EMAIL) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const configured = !!process.env.ENCRYPTION_MASTER_KEY;
    let fingerprint: string | null = null;

    if (configured) {
      try {
        fingerprint = masterKeyFingerprint();
      } catch {
        fingerprint = null;
      }
    }

    return NextResponse.json({
      configured,
      fingerprint,
      algorithm: "AES-256-GCM",
      keyDerivation: "HKDF-SHA256 (per-user)",
      protectedTables: [
        { table: "deals",             fields: ["address", "notes"] },
        { table: "projects",          fields: ["name", "address", "notes"] },
        { table: "company_documents", fields: ["document_name", "notes"] },
      ],
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
