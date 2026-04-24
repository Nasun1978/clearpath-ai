import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import type { VendorType, VendorCertification } from "@/types";

// GET /api/marketplace/vendors?type=Architect&cert=DBE&area=Houston
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = request.nextUrl.searchParams;
    const type = params.get("type") as VendorType | null;
    const cert = params.get("cert") as VendorCertification | null;
    const search = params.get("q");

    let query = supabase
      .from("vendor_profiles")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (type) query = query.eq("vendor_type", type);
    if (search) query = query.ilike("company_name", `%${search}%`);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Filter by certification client-side (JSONB array contains)
    const vendors = cert
      ? (data ?? []).filter((v) => (v.certifications as string[]).includes(cert))
      : (data ?? []);

    return NextResponse.json({ vendors });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
