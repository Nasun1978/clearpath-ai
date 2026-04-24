import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";

interface BidCreateBody {
  listing_id: string;
  bid_amount?: number;
  proposal_text: string;
  estimated_timeline?: string;
  attachments_url?: string;
}

// POST /api/marketplace/bids
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as BidCreateBody;

    if (!body.listing_id) return NextResponse.json({ error: "listing_id is required" }, { status: 400 });
    if (!body.proposal_text?.trim()) return NextResponse.json({ error: "proposal_text is required" }, { status: 400 });

    // Get vendor profile for this user
    const { data: vendorProfile } = await supabase
      .from("vendor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!vendorProfile) {
      return NextResponse.json({ error: "You must register as a vendor before bidding" }, { status: 403 });
    }

    // Check subscription allows bidding
    const { data: sub } = await supabase
      .from("vendor_subscriptions")
      .select("*")
      .eq("vendor_user_id", user.id)
      .single();

    if (!sub || sub.status !== "active") {
      return NextResponse.json({ error: "Active subscription required to submit bids" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("vendor_bids")
      .insert({
        listing_id:         body.listing_id,
        vendor_id:          vendorProfile.id,
        bid_amount:         body.bid_amount ?? null,
        proposal_text:      body.proposal_text.trim(),
        estimated_timeline: body.estimated_timeline?.trim() ?? null,
        attachments_url:    body.attachments_url ?? null,
        status:             "submitted",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "You have already submitted a bid for this project" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ bid: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
