import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, createServerClient } from "@/lib/supabase";

// ── DELETE /api/documents/[id] ────────────────────────────────────────────────
// Deletes the DB record and the corresponding storage object.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch the record first so we know the storage path and can verify ownership via RLS
    const { data: doc, error: fetchErr } = await supabase
      .from("company_documents")
      .select("id, file_path, user_id")
      .eq("id", params.id)
      .eq("user_id", user.id)
      .single();

    if (fetchErr || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Delete from storage using the admin client (service role has no folder restrictions)
    const admin = createServerClient();
    const { error: storageErr } = await admin.storage
      .from("company-docs")
      .remove([doc.file_path]);

    // Log storage errors but don't block the DB delete — orphaned storage objects
    // are preferable to orphaned DB rows with no way to delete.
    if (storageErr) {
      console.error("Storage delete error (non-fatal):", storageErr.message);
    }

    // Delete the DB record (RLS confirms ownership)
    const { error: dbErr } = await supabase
      .from("company_documents")
      .delete()
      .eq("id", params.id);

    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
