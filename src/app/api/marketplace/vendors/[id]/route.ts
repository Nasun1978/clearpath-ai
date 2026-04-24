import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";

// GET /api/marketplace/vendors/[id]
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("vendor_profiles")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    return NextResponse.json({ vendor: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
