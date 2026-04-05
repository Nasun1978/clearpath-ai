import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { Project, ProjectType } from "@/types";

const VALID_TYPES: ProjectType[] = [
  "lihtc_9pct", "lihtc_4pct", "home", "htf", "cdbg", "mixed_use", "market_rate", "other",
];

// GET /api/projects — list all projects ordered by newest first
export async function GET() {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ projects: data as Project[] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/projects — create a project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Partial<Project>;

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.type || !VALID_TYPES.includes(body.type)) {
      return NextResponse.json({ error: "valid type is required" }, { status: 400 });
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("projects")
      .insert({
        name: body.name.trim(),
        address: body.address?.trim() || null,
        type: body.type,
        budget: body.budget ?? null,
        timeline: body.timeline?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ project: data as Project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
