import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import type { TaskAssignment } from "@/types";

// GET /api/task-assignments?checklist_id=<uuid>
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const checklistId = request.nextUrl.searchParams.get("checklist_id");
    if (!checklistId) {
      return NextResponse.json({ error: "checklist_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("task_assignments")
      .select("*")
      .eq("checklist_id", checklistId)
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assignments: data as TaskAssignment[] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// POST /api/task-assignments — upsert an assignment (one per item per checklist)
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as {
      checklist_item_id: string;
      checklist_id: string;
      assigned_to_email: string;
      item_text?: string;
      checklist_name?: string;
      due_date?: string | null;
      status?: TaskAssignment["status"];
      notes?: string;
    };

    if (!body.checklist_item_id?.trim()) {
      return NextResponse.json({ error: "checklist_item_id is required" }, { status: 400 });
    }
    if (!body.checklist_id?.trim()) {
      return NextResponse.json({ error: "checklist_id is required" }, { status: 400 });
    }
    if (!body.assigned_to_email?.trim()) {
      return NextResponse.json({ error: "assigned_to_email is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("task_assignments")
      .upsert(
        {
          checklist_item_id:  body.checklist_item_id,
          checklist_id:       body.checklist_id,
          item_text:          body.item_text ?? null,
          checklist_name:     body.checklist_name ?? null,
          assigned_to_email:  body.assigned_to_email.trim().toLowerCase(),
          assigned_by:        user.id,
          due_date:           body.due_date ?? null,
          status:             body.status ?? "pending",
          notes:              body.notes?.trim() ?? null,
        },
        { onConflict: "checklist_item_id,checklist_id" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ assignment: data as TaskAssignment }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// DELETE /api/task-assignments?checklist_item_id=&checklist_id=
export async function DELETE(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const itemId      = request.nextUrl.searchParams.get("checklist_item_id");
    const checklistId = request.nextUrl.searchParams.get("checklist_id");

    if (!itemId || !checklistId) {
      return NextResponse.json({ error: "checklist_item_id and checklist_id are required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("task_assignments")
      .delete()
      .eq("checklist_item_id", itemId)
      .eq("checklist_id", checklistId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
