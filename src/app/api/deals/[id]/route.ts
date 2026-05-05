import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import { encryptFields, decryptFields } from "@/lib/encryption";
import type { Deal, DealStage } from "@/types";

const DEAL_ENCRYPTED_FIELDS: (keyof Deal)[] = ["address", "notes"];

const VALID_STAGES: DealStage[] = [
  "prospecting", "due_diligence", "under_contract", "closed",
];

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const NOT_CONFIGURED = NextResponse.json(
  { error: "Supabase is not configured." },
  { status: 503 }
);

// PATCH /api/deals/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseConfigured) return NOT_CONFIGURED;
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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

    // Encrypt any text fields before writing
    const encryptedUpdates = encryptFields(updates, user.id, DEAL_ENCRYPTED_FIELDS);

    // RLS ensures the user can only update their own rows
    const { data, error } = await supabase
      .from("deals")
      .update(encryptedUpdates)
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const deal = decryptFields(data as Deal, user.id, DEAL_ENCRYPTED_FIELDS);
    return NextResponse.json({ deal });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// DELETE /api/deals/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!supabaseConfigured) return NOT_CONFIGURED;
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // RLS ensures only the owner can delete
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
