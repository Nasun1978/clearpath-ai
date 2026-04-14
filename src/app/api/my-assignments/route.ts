import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import type { TaskAssignment } from "@/types";

// GET /api/my-assignments
// Returns all task_assignments where assigned_to_email matches the current user's email.
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (!user.email) {
      return NextResponse.json({ assignments: [] });
    }

    const { data, error } = await supabase
      .from("task_assignments")
      .select("*")
      .eq("assigned_to_email", user.email.toLowerCase())
      .order("due_date", { ascending: true, nullsFirst: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assignments: data as TaskAssignment[], email: user.email });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// PATCH /api/my-assignments?id=<uuid> — update assignment status
export async function PATCH(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const id   = request.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const body = await request.json() as { status?: TaskAssignment["status"] };
    const allowed = ["pending", "in_progress", "complete"];
    if (!body.status || !allowed.includes(body.status)) {
      return NextResponse.json({ error: "valid status is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("task_assignments")
      .update({ status: body.status })
      .eq("id", id)
      .eq("assigned_to_email", user.email?.toLowerCase() ?? "")
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assignment: data as TaskAssignment });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
