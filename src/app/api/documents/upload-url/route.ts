import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, createServerClient } from "@/lib/supabase";
import { randomUUID } from "crypto";

// ── POST /api/documents/upload-url ───────────────────────────────────────────
// Returns a signed upload URL so the browser can PUT directly to Supabase Storage.
// The file is stored at {user_id}/{uuid}-{sanitized_filename} to avoid collisions.
// Body: { filename: string, content_type: string }
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as { filename?: string; content_type?: string };
    if (!body.filename?.trim()) {
      return NextResponse.json({ error: "filename is required" }, { status: 400 });
    }
    if (!body.content_type?.trim()) {
      return NextResponse.json({ error: "content_type is required" }, { status: 400 });
    }

    // Sanitize filename: strip path separators, collapse whitespace
    const safe = body.filename.replace(/[/\\]/g, "_").replace(/\s+/g, "_");
    const filePath = `${user.id}/${randomUUID()}-${safe}`;

    // Use service-role client — signed upload URLs bypass storage RLS,
    // but we've already scoped the path to user.id so ownership is enforced.
    const admin = createServerClient();
    const { data, error } = await admin.storage
      .from("company-docs")
      .createSignedUploadUrl(filePath);

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Failed to create upload URL" }, { status: 500 });
    }

    return NextResponse.json({
      upload_url: data.signedUrl,
      file_path:  filePath,
      token:      data.token,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
