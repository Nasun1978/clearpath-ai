import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import type { ProjectListingStatus, VendorBid } from "@/types";

// GET /api/marketplace/listings/[id] — returns listing + bids (for developer)
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: listing, error } = await supabase
      .from("project_listings")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) return NextResponse.json({ error: "Listing not found" }, { status: 404 });

    // Fetch bids with vendor profiles only if this is the developer
    let bids: VendorBid[] = [];
    if (listing.developer_user_id === user.id) {
      const { data: bidData } = await supabase
        .from("vendor_bids")
        .select("*, vendor:vendor_profiles(*)")
        .eq("listing_id", params.id)
        .order("submitted_at", { ascending: false });
      bids = (bidData ?? []) as VendorBid[];
    }

    // Check if current user has already bid (for vendor view)
    const { data: myProfile } = await supabase
      .from("vendor_profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let myBid = null;
    if (myProfile) {
      const { data: bid } = await supabase
        .from("vendor_bids")
        .select("*")
        .eq("listing_id", params.id)
        .eq("vendor_id", myProfile.id)
        .single();
      myBid = bid;
    }

    return NextResponse.json({ listing, bids, myBid, isOwner: listing.developer_user_id === user.id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// PATCH /api/marketplace/listings/[id] — update status or details
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as { status?: ProjectListingStatus };

    const { data, error } = await supabase
      .from("project_listings")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", params.id)
      .eq("developer_user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ listing: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// DELETE /api/marketplace/listings/[id]
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { error } = await supabase
      .from("project_listings")
      .delete()
      .eq("id", params.id)
      .eq("developer_user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
