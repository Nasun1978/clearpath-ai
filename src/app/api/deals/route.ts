import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import { encryptFields, decryptRecords } from "@/lib/encryption";
import type { Deal, DealStage } from "@/types";

const DEAL_ENCRYPTED_FIELDS: (keyof Deal)[] = ["address", "notes"];

const VALID_STAGES: DealStage[] = [
  "prospecting", "due_diligence", "under_contract", "closed",
];

const supabaseConfigured =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// GET /api/deals — all deals for the authenticated user
export async function GET(request: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json(
      { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local." },
      { status: 503 }
    );
  }
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const deals = decryptRecords(data as Deal[], user.id, DEAL_ENCRYPTED_FIELDS);
    return NextResponse.json({ deals });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/deals — create a deal (user_id auto-set by DB trigger)
export async function POST(request: NextRequest) {
  if (!supabaseConfigured) {
    return NextResponse.json(
      { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local." },
      { status: 503 }
    );
  }
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as Partial<Deal>;

    if (!body.address?.trim()) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }
    const stage: DealStage = VALID_STAGES.includes(body.stage as DealStage)
      ? (body.stage as DealStage)
      : "prospecting";

    const plainPayload = {
      address: body.address.trim(),
      notes: body.notes?.trim() || null,
    };
    const encrypted = encryptFields(plainPayload, user.id, ["address", "notes"]);

    const { data, error } = await supabase
      .from("deals")
      .insert({
        ...encrypted,
        price: body.price ?? null,
        projected_roi: body.projected_roi ?? null,
        stage,
        sort_order: 0,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    const deal = decryptRecords([data as Deal], user.id, DEAL_ENCRYPTED_FIELDS)[0];
    return NextResponse.json({ deal }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
