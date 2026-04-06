// @ts-nocheck
// ============================================================================
// /api/proposals — CRUD operations for proposals
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import { DEMO_PROPOSALS } from "@/lib/demo-data";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

// GET /api/proposals?status=in_review&agency_id=xxx&limit=50
export async function GET(request: NextRequest) {
  if (DEMO_MODE) {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const filtered = status
      ? DEMO_PROPOSALS.filter((p) => p.status === status)
      : DEMO_PROPOSALS;
    return NextResponse.json({ proposals: filtered, total: filtered.length });
  }

  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status");
    const agencyId = searchParams.get("agency_id");
    const creditType = searchParams.get("credit_type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("proposals")
      .select(
        `
        *,
        agency:agencies(id, name, abbreviation),
        reviewer:profiles!assigned_reviewer_id(id, full_name, email)
      `,
        { count: "exact" }
      )
      .order("submitted_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (agencyId) query = query.eq("agency_id", agencyId);
    if (creditType) query = query.eq("credit_type", creditType);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ proposals: data, total: count });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// POST /api/proposals — Create a new proposal
export async function POST(request: NextRequest) {
  if (DEMO_MODE) {
    return NextResponse.json(
      { error: "Proposal creation is disabled in demo mode." },
      { status: 403 }
    );
  }

  try {
    const { user, supabase } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await request.json();

    const required = ["project_name", "developer_entity", "credit_type"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    const { data: proposalId, error } = await supabase.rpc("create_proposal", {
      p_project_name: body.project_name,
      p_developer_entity: body.developer_entity,
      p_credit_type: body.credit_type,
      p_total_units: body.total_units || null,
      p_total_development_cost: body.total_development_cost || null,
      p_agency_id: body.agency_id || null,
      p_submitted_by: body.submitted_by_id || null,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const updateFields: Record<string, unknown> = {};
    const optionalFields = [
      "project_address", "city", "county", "state", "zip_code",
      "developer_contact_name", "developer_contact_email", "developer_contact_phone",
      "set_aside_election", "is_new_construction", "is_rehab", "is_acquisition",
      "affordable_units", "market_rate_units",
      "ami_30_pct_units", "ami_50_pct_units", "ami_60_pct_units", "ami_80_pct_units", "ami_120_pct_units",
      "eligible_basis", "qualified_basis", "annual_credit_amount", "credit_price",
      "tax_credit_equity", "bond_amount",
      "permanent_loan_amount", "permanent_loan_rate", "permanent_loan_term", "dscr",
      "developer_fee", "developer_fee_pct", "deferred_developer_fee",
      "is_qct", "is_dda", "is_opportunity_zone", "census_tract",
      "fema_flood_zone", "zoning_designation", "acreage",
      "qap_state", "qap_year",
    ];

    for (const field of optionalFields) {
      if (body[field] !== undefined) updateFields[field] = body[field];
    }

    if (Object.keys(updateFields).length > 0) {
      await supabase.from("proposals").update(updateFields).eq("id", proposalId);
    }

    const { data: proposal } = await supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .single();

    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
