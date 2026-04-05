import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { Deal, DealStage } from "@/types";

const VALID_STAGES: DealStage[] = [
  "prospecting", "due_diligence", "under_contract", "closed",
];

// PATCH /api/deals/[id] — update stage (and optionally other fields)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json() as Partial<Deal>;
    const updates: Partial<Deal> = {};

    if (body.stage !== undefined) {
      if (!VALID_STAGES.includes(body.stage)) {
        return NextResponse.json({ error: "invalid stage" }, { status: 400 });
      }
      updates.stage = body.stage;
    }
    if (body.price !== undefined) updates.price = body.price;
    if (body.projected_roi !== undefined) updates.projected_roi = body.projected_roi;
    if (body.notes !== undefined) updates.notes = body.notes;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("deals")
      .update(updates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ deal: data as Deal });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE /api/deals/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("deals").delete().eq("id", params.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
