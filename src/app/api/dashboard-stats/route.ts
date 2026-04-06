// @ts-nocheck
// ============================================================================
// GET /api/dashboard-stats — Dashboard summary statistics
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import { DEMO_STATS } from "@/lib/demo-data";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(request: NextRequest) {
  if (DEMO_MODE) {
    return NextResponse.json(DEMO_STATS);
  }

  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const agencyId = searchParams.get("agency_id");

    const { data, error } = await supabase.rpc("get_dashboard_stats", {
      p_agency_id: agencyId || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
