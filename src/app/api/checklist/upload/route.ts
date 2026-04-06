import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, createServerClient } from "@/lib/supabase";

const BUCKET = "checklist-docs";

// POST /api/checklist/upload
// Body: FormData — file (File), checklist_id (string), item_id (string)
export async function POST(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    // Authenticate the user with their session
    const { user } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const checklistId = formData.get("checklist_id") as string | null;
    const itemId = formData.get("item_id") as string | null;

    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
    if (!checklistId || !itemId) {
      return NextResponse.json({ error: "checklist_id and item_id are required" }, { status: 400 });
    }

    // Prefix the storage path with the user's uid so storage RLS can enforce ownership
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `${user.id}/${checklistId}/${itemId}_${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // Use service role for storage upload (storage RLS is enforced separately via policy)
    const adminSupabase = createServerClient();
    const { error: uploadError } = await adminSupabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}. Ensure the '${BUCKET}' bucket exists in Supabase Storage.` },
        { status: 500 }
      );
    }

    const { data: urlData } = adminSupabase.storage.from(BUCKET).getPublicUrl(path);
    return NextResponse.json({ url: urlData.publicUrl, file_name: file.name });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
