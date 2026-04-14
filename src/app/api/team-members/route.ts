import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import type { TeamMember, TeamMemberRole, TEAM_MEMBER_ROLES } from "@/types";

// Validate role against allowed list (avoid importing the array to keep bundle lean)
const VALID_ROLES: TeamMemberRole[] = [
  "Developer", "Co-Developer", "Architect", "General Contractor",
  "Civil Engineer", "Structural Engineer", "MEP Engineer", "Attorney",
  "Lender", "Market Analyst", "Property Manager", "Tax Credit Syndicator",
  "Accountant", "Environmental Consultant", "Appraiser", "Surveyor",
  "Title Company", "Consultant", "Government Liaison", "Other",
];

// GET /api/team-members?project_id=<uuid>  → members for one project
// GET /api/team-members                    → all team members across user's projects
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const projectId = request.nextUrl.searchParams.get("project_id");

    let query = supabase
      .from("team_members")
      .select("*")
      .order("created_at", { ascending: true });

    if (projectId) {
      query = query.eq("project_id", projectId);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ members: data as TeamMember[] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// POST /api/team-members — add a team member to a project
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as Partial<TeamMember>;

    if (!body.project_id?.trim()) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }
    if (!body.full_name?.trim()) {
      return NextResponse.json({ error: "full_name is required" }, { status: 400 });
    }
    if (!body.email?.trim()) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }
    if (!body.role || !VALID_ROLES.includes(body.role)) {
      return NextResponse.json({ error: "valid role is required" }, { status: 400 });
    }

    // Confirm the project belongs to this user before inserting (belt-and-suspenders over RLS)
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id")
      .eq("id", body.project_id)
      .single();

    if (projErr || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("team_members")
      .insert({
        project_id:  body.project_id,
        full_name:   body.full_name.trim(),
        email:       body.email.trim().toLowerCase(),
        phone:       body.phone?.trim() || null,
        role:        body.role,
        company:     body.company?.trim() || null,
        notes:       body.notes?.trim() || null,
        invited_by:  user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ member: data as TeamMember }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
