import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import type { VendorProfile, VendorType, VendorCertification } from "@/types";

interface ProfileBody {
  company_name?: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  website?: string;
  vendor_type?: VendorType;
  license_number?: string;
  certifications?: VendorCertification[];
  service_areas?: string[];
  bio?: string;
  portfolio_url?: string;
  years_experience?: number;
}

// GET /api/vendor/profile — returns current user's vendor profile
export async function GET(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("vendor_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Also return subscription info
    const { data: sub } = await supabase
      .from("vendor_subscriptions")
      .select("*")
      .eq("vendor_user_id", user.id)
      .single();

    return NextResponse.json({ profile: data ?? null, subscription: sub ?? null });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// POST /api/vendor/profile — create vendor profile
export async function POST(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as ProfileBody;

    if (!body.company_name?.trim()) return NextResponse.json({ error: "company_name is required" }, { status: 400 });
    if (!body.contact_name?.trim()) return NextResponse.json({ error: "contact_name is required" }, { status: 400 });
    if (!body.email?.trim()) return NextResponse.json({ error: "email is required" }, { status: 400 });
    if (!body.vendor_type) return NextResponse.json({ error: "vendor_type is required" }, { status: 400 });

    const { data, error } = await supabase
      .from("vendor_profiles")
      .insert({
        user_id:          user.id,
        company_name:     body.company_name.trim(),
        contact_name:     body.contact_name.trim(),
        email:            body.email.trim(),
        phone:            body.phone?.trim() ?? null,
        website:          body.website?.trim() ?? null,
        vendor_type:      body.vendor_type,
        license_number:   body.license_number?.trim() ?? null,
        certifications:   body.certifications ?? [],
        service_areas:    body.service_areas ?? [],
        bio:              body.bio?.trim() ?? null,
        portfolio_url:    body.portfolio_url?.trim() ?? null,
        years_experience: body.years_experience ?? null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "A vendor profile already exists for this account" }, { status: 409 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data as VendorProfile }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}

// PUT /api/vendor/profile — update vendor profile
export async function PUT(request: NextRequest) {
  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as ProfileBody;

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.company_name)     updates.company_name     = body.company_name.trim();
    if (body.contact_name)     updates.contact_name     = body.contact_name.trim();
    if (body.email)            updates.email            = body.email.trim();
    if (body.phone !== undefined)    updates.phone      = body.phone?.trim() ?? null;
    if (body.website !== undefined)  updates.website    = body.website?.trim() ?? null;
    if (body.vendor_type)      updates.vendor_type      = body.vendor_type;
    if (body.license_number !== undefined) updates.license_number = body.license_number?.trim() ?? null;
    if (body.certifications)   updates.certifications   = body.certifications;
    if (body.service_areas)    updates.service_areas    = body.service_areas;
    if (body.bio !== undefined)      updates.bio        = body.bio?.trim() ?? null;
    if (body.portfolio_url !== undefined) updates.portfolio_url = body.portfolio_url?.trim() ?? null;
    if (body.years_experience !== undefined) updates.years_experience = body.years_experience;

    const { data, error } = await supabase
      .from("vendor_profiles")
      .update(updates)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ profile: data as VendorProfile });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
