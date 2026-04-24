import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import type { ProjectListing, VendorType, MarketplaceProjectType } from "@/types";

interface ListingCreateBody {
  project_name: string;
  project_address?: string;
  project_type: MarketplaceProjectType;
  unit_count?: number;
  estimated_budget?: number;
  description: string;
  services_needed: VendorType[];
  deadline?: string;
}

// GET /api/marketplace/listings?status=open&service=Architect&type=New+Construction
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = request.nextUrl.searchParams;
    const status = params.get("status") ?? "open";
    const service = params.get("service");
    const projectType = params.get("type");

    let query = supabase
      .from("project_listings")
      .select("*")
      .order("created_at", { ascending: false });

    // RLS handles access; additionally filter by status for public view
    if (status !== "all") query = query.eq("status", status);
    if (projectType) query = query.eq("project_type", projectType);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Attach bid counts
    const listings = await Promise.all(
      (data as ProjectListing[]).map(async (listing) => {
        const { count } = await supabase
          .from("vendor_bids")
          .select("*", { count: "exact", head: true })
          .eq("listing_id", listing.id);
        let result = { ...listing, bid_count: count ?? 0 };
        // Client-side filter for services_needed (JSONB contains)
        if (service && !listing.services_needed.includes(service as VendorType)) return null;
        return result;
      })
    );

    return NextResponse.json({ listings: listings.filter(Boolean) });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// POST /api/marketplace/listings
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as ListingCreateBody;

    if (!body.project_name?.trim()) return NextResponse.json({ error: "project_name is required" }, { status: 400 });
    if (!body.description?.trim()) return NextResponse.json({ error: "description is required" }, { status: 400 });
    if (!body.project_type) return NextResponse.json({ error: "project_type is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("project_listings")
      .insert({
        developer_user_id: user.id,
        project_name:      body.project_name.trim(),
        project_address:   body.project_address?.trim() ?? null,
        project_type:      body.project_type,
        unit_count:        body.unit_count ?? null,
        estimated_budget:  body.estimated_budget ?? null,
        description:       body.description.trim(),
        services_needed:   body.services_needed ?? [],
        deadline:          body.deadline ?? null,
        status:            "open",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ listing: data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
