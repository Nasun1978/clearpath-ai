import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import type { VendorBidStatus } from "@/types";

// PATCH /api/marketplace/bids/[id] — developer updates bid status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { status } = await request.json() as { status: VendorBidStatus };
    const validStatuses: VendorBidStatus[] = ["submitted", "shortlisted", "awarded", "rejected"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify caller is the developer who owns the listing this bid belongs to
    const { data: bid } = await supabase
      .from("vendor_bids")
      .select("listing_id")
      .eq("id", params.id)
      .single();

    if (!bid) return NextResponse.json({ error: "Bid not found" }, { status: 404 });

    const { data: listing } = await supabase
      .from("project_listings")
      .select("developer_user_id")
      .eq("id", bid.listing_id)
      .single();

    if (!listing || listing.developer_user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("vendor_bids")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ bid: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
