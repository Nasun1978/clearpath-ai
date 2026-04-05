import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

const NOT_CONFIGURED = NextResponse.json(
  { error: "Supabase is not configured." },
  { status: 503 }
);

// GET /api/checklist/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseConfigured) return NOT_CONFIGURED;
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("lihtc_checklist")
      .select("*")
      .eq("id", params.id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ checklist: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// PATCH /api/checklist/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseConfigured) return NOT_CONFIGURED;
  try {
    const body = await request.json() as Record<string, unknown>;
    const allowed = ["project_name", "developer", "location_parish", "total_units", "project_type", "date_prepared", "checklist_items"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("lihtc_checklist")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ checklist: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// DELETE /api/checklist/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseConfigured) return NOT_CONFIGURED;
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("lihtc_checklist").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
