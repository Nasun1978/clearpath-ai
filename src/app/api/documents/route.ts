import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, createServerClient } from "@/lib/supabase";
import { encryptFields, decryptRecords } from "@/lib/encryption";
import type { CompanyDocument } from "@/types";
import { COMPANY_DOCUMENT_TYPES } from "@/types";

const DOC_ENCRYPTED_FIELDS: (keyof CompanyDocument)[] = ["document_name", "notes"];

const VALID_TYPES = COMPANY_DOCUMENT_TYPES.map((t) => t.value);
const SIGNED_URL_EXPIRY = 3600; // 1 hour

interface DocumentCreateBody {
  document_type?: string;
  document_name?: string;
  file_path?: string;
  file_url?: string;
  file_size?: number | null;
  expires_at?: string | null;
  notes?: string | null;
  folder_path?: string | null;
}

// ── GET /api/documents ────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const folderFilter = request.nextUrl.searchParams.get("folder_path");

    let query = supabase
      .from("company_documents")
      .select("*")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false });

    if (folderFilter) {
      query = query.eq("folder_path", folderFilter);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const admin = createServerClient();
    const docs = await Promise.all(
      (data as CompanyDocument[]).map(async (doc) => {
        const { data: urlData } = await admin.storage
          .from("company-docs")
          .createSignedUrl(doc.file_path, SIGNED_URL_EXPIRY);
        return { ...doc, signed_url: urlData?.signedUrl ?? null };
      })
    );

    const decrypted = decryptRecords(docs as CompanyDocument[], user.id, DOC_ENCRYPTED_FIELDS);
    return NextResponse.json({ documents: decrypted });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// ── POST /api/documents ───────────────────────────────────────────────────────
// Body: { document_type?, document_name, file_path, file_url?, file_size?, expires_at?, notes?, folder_path? }
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as DocumentCreateBody;

    if (!body.document_name?.trim()) {
      return NextResponse.json({ error: "document_name is required" }, { status: 400 });
    }
    if (!body.file_path?.trim()) {
      return NextResponse.json({ error: "file_path is required" }, { status: 400 });
    }
    if (!body.file_path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: "file_path must be scoped to your user folder" }, { status: 400 });
    }

    const docType = body.document_type && (VALID_TYPES as string[]).includes(body.document_type)
      ? body.document_type
      : "other";

    const plainText = {
      document_name: body.document_name.trim(),
      notes: body.notes?.trim() ?? null,
    };
    const encrypted = encryptFields(plainText, user.id, ["document_name", "notes"]);

    const { data, error } = await supabase
      .from("company_documents")
      .insert({
        user_id:       user.id,
        document_type: docType,
        document_name: encrypted.document_name,
        file_url:      body.file_url ?? "",
        file_path:     body.file_path.trim(),
        file_size:     body.file_size ?? null,
        expires_at:    body.expires_at ?? null,
        notes:         encrypted.notes,
        folder_path:   body.folder_path ?? null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const document = decryptRecords([data as CompanyDocument], user.id, DOC_ENCRYPTED_FIELDS)[0];
    return NextResponse.json({ document }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
