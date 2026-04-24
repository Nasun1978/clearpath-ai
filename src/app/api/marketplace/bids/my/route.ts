import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import type { VendorBid } from "@/types";

// GET /api/marketplace/bids/my — returns all bids submitted by the current vendor
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("vendor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!profile) return NextResponse.json({ bids: [] });

    const { data, error } = await supabase
      .from("vendor_bids")
      .select("*, listing:project_listings(*)")
      .eq("vendor_id", profile.id)
      .order("submitted_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bids: (data ?? []) as VendorBid[] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
