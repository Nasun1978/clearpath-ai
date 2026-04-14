import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, createServerClient } from "@/lib/supabase";
import type { CompanyDocument, CompanyDocumentType } from "@/types";
import { COMPANY_DOCUMENT_TYPES } from "@/types";

const VALID_TYPES = COMPANY_DOCUMENT_TYPES.map((t) => t.value);
const SIGNED_URL_EXPIRY = 3600; // 1 hour

// ── GET /api/documents?type=<type> ────────────────────────────────────────────
// Returns all documents for the authenticated user, optionally filtered by type.
// Each record includes a fresh signed download URL.
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const typeFilter = request.nextUrl.searchParams.get("type") as CompanyDocumentType | null;

    let query = supabase
      .from("company_documents")
      .select("*")
      .eq("user_id", user.id)
      .order("uploaded_at", { ascending: false });

    if (typeFilter && VALID_TYPES.includes(typeFilter)) {
      query = query.eq("document_type", typeFilter);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Generate signed URLs using the service-role client so we can read
    // files stored under any user's folder (the calling user's own files via RLS-validated paths).
    const admin = createServerClient();
    const docs = await Promise.all(
      (data as CompanyDocument[]).map(async (doc) => {
        const { data: urlData } = await admin.storage
          .from("company-docs")
          .createSignedUrl(doc.file_path, SIGNED_URL_EXPIRY);
        return { ...doc, signed_url: urlData?.signedUrl ?? null };
      })
    );

    return NextResponse.json({ documents: docs });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// ── POST /api/documents ───────────────────────────────────────────────────────
// Creates a document record AFTER the file has been uploaded to storage.
// Body: { document_type, document_name, file_path, file_url, file_size, expires_at?, notes? }
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as Partial<CompanyDocument>;

    if (!body.document_type || !VALID_TYPES.includes(body.document_type)) {
      return NextResponse.json({ error: "valid document_type is required" }, { status: 400 });
    }
    if (!body.document_name?.trim()) {
      return NextResponse.json({ error: "document_name is required" }, { status: 400 });
    }
    if (!body.file_path?.trim()) {
      return NextResponse.json({ error: "file_path is required" }, { status: 400 });
    }

    // Enforce that the storage path is scoped to this user — belt-and-suspenders over storage RLS
    if (!body.file_path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: "file_path must be scoped to your user folder" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("company_documents")
      .insert({
        user_id:       user.id,
        document_type: body.document_type,
        document_name: body.document_name.trim(),
        file_url:      body.file_url ?? "",
        file_path:     body.file_path.trim(),
        file_size:     body.file_size ?? null,
        expires_at:    body.expires_at ?? null,
        notes:         body.notes?.trim() ?? null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ document: data as CompanyDocument }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
