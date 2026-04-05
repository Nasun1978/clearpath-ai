import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import type { Deal, DealStage } from "@/types";

const VALID_STAGES: DealStage[] = [
  "prospecting", "due_diligence", "under_contract", "closed",
];

// GET /api/deals — all deals ordered by stage then sort_order
export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local." },
      { status: 503 }
    );
  }
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ deals: data as Deal[] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/deals — create a deal
export async function POST(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local." },
      { status: 503 }
    );
  }
  try {
    const body = await request.json() as Partial<Deal>;

    if (!body.address?.trim()) {
      return NextResponse.json({ error: "address is required" }, { status: 400 });
    }
    const stage: DealStage = VALID_STAGES.includes(body.stage as DealStage)
      ? (body.stage as DealStage)
      : "prospecting";

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("deals")
      .insert({
        address: body.address.trim(),
        price: body.price ?? null,
        projected_roi: body.projected_roi ?? null,
        stage,
        notes: body.notes?.trim() || null,
        sort_order: 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ deal: data as Deal }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
