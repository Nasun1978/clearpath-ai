import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import { encryptFields, decryptRecords } from "@/lib/encryption";
import type { Project, ProjectType } from "@/types";

const PROJECT_ENCRYPTED_FIELDS: (keyof Project)[] = ["name", "address", "notes"];

const VALID_TYPES: ProjectType[] = [
  "lihtc_9pct", "lihtc_4pct", "home", "htf", "cdbg", "mixed_use", "market_rate", "other",
];

// GET /api/projects — list projects for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const projects = decryptRecords(data as Project[], user.id, PROJECT_ENCRYPTED_FIELDS);
    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/projects — create a project (user_id auto-set by DB trigger)
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as Partial<Project>;

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!body.type || !VALID_TYPES.includes(body.type)) {
      return NextResponse.json({ error: "valid type is required" }, { status: 400 });
    }

    const plainPayload = {
      name: body.name.trim(),
      address: body.address?.trim() || null,
      notes: body.notes?.trim() || null,
    };
    const encrypted = encryptFields(plainPayload, user.id, ["name", "address", "notes"]);

    const { data, error } = await supabase
      .from("projects")
      .insert({
        ...encrypted,
        type: body.type,
        budget: body.budget ?? null,
        timeline: body.timeline?.trim() || null,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const project = decryptRecords([data as Project], user.id, PROJECT_ENCRYPTED_FIELDS)[0];
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
