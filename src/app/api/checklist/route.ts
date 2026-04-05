import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

const NOT_CONFIGURED = NextResponse.json(
  { error: "Supabase is not configured." },
  { status: 503 }
);

// GET /api/checklist — list all checklists (most recent first)
export async function GET() {
  if (!supabaseConfigured) return NOT_CONFIGURED;
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("lihtc_checklist")
      .select("id, project_name, developer, location_parish, total_units, project_type, date_prepared, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ checklists: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// POST /api/checklist — create new checklist
export async function POST(request: NextRequest) {
  if (!supabaseConfigured) return NOT_CONFIGURED;
  try {
    const body = await request.json() as {
      project_name?: string;
      developer?: string;
      location_parish?: string;
      total_units?: number | null;
      project_type?: string;
      date_prepared?: string;
      checklist_items?: unknown[];
    };
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("lihtc_checklist")
      .insert({
        project_name: body.project_name ?? "",
        developer: body.developer ?? "",
        location_parish: body.location_parish ?? "",
        total_units: body.total_units ?? null,
        project_type: body.project_type ?? "new_construction",
        date_prepared: body.date_prepared ?? new Date().toISOString().slice(0, 10),
        checklist_items: body.checklist_items ?? [],
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ checklist: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
