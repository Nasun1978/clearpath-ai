import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import type { TeamMember, TeamMemberRole } from "@/types";

const VALID_ROLES: TeamMemberRole[] = [
  "Developer", "Co-Developer", "Architect", "General Contractor",
  "Civil Engineer", "Structural Engineer", "MEP Engineer", "Attorney",
  "Lender", "Market Analyst", "Property Manager", "Tax Credit Syndicator",
  "Accountant", "Environmental Consultant", "Appraiser", "Surveyor",
  "Title Company", "Consultant", "Government Liaison", "Other",
];

// PATCH /api/team-members/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as Partial<TeamMember>;
    const updates: Record<string, unknown> = {};

    if (body.full_name !== undefined) updates.full_name = body.full_name.trim();
    if (body.email    !== undefined) updates.email    = body.email.trim().toLowerCase();
    if (body.phone    !== undefined) updates.phone    = body.phone?.trim() || null;
    if (body.company  !== undefined) updates.company  = body.company?.trim() || null;
    if (body.notes    !== undefined) updates.notes    = body.notes?.trim() || null;
    if (body.role     !== undefined) {
      if (!VALID_ROLES.includes(body.role)) {
        return NextResponse.json({ error: "invalid role" }, { status: 400 });
      }
      updates.role = body.role;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "no fields to update" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("team_members")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!data)  return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ member: data as TeamMember });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// DELETE /api/team-members/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", params.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
