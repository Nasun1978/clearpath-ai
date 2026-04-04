// GET /api/proposals/[id] — Fetch a single proposal with all related data
// PATCH /api/proposals/[id] — Update a proposal

import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { DEMO_PROPOSALS, DEMO_COMPLIANCE_CHECKS, DEMO_QAP_SCORES } from "@/lib/demo-data";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (DEMO_MODE) {
    const proposal = DEMO_PROPOSALS.find((p) => p.id === params.id);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }
    return NextResponse.json({
      proposal,
      compliance_checks: DEMO_COMPLIANCE_CHECKS[params.id] || [],
      qap_scores: DEMO_QAP_SCORES[params.id] || [],
      documents: [],
      deficiencies: [],
      activity: [],
    });
  }

  try {
    const supabase = getServerClient();
    const proposalId = params.id;

    const { data: proposal, error } = await supabase
      .from("proposals")
      .select(`*, agency:agencies(*), reviewer:profiles!assigned_reviewer_id(*)`)
      .eq("id", proposalId)
      .single();

    if (error || !proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const { data: checks } = await supabase
      .from("compliance_checks")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("sort_order")
      .order("created_at");

    const { data: qapScores } = await supabase
      .from("qap_scoring")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("sort_order");

    const { data: documents } = await supabase
      .from("documents")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("uploaded_at");

    const { data: deficiencies } = await supabase
      .from("deficiencies")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("item_number");

    const { data: activity } = await supabase
      .from("activity_log")
      .select("*")
      .eq("proposal_id", proposalId)
      .order("created_at", { ascending: false })
      .limit(50);

    return NextResponse.json({
      proposal,
      compliance_checks: checks || [],
      qap_scores: qapScores || [],
      documents: documents || [],
      deficiencies: deficiencies || [],
      activity: activity || [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (DEMO_MODE) {
    return NextResponse.json(
      { error: "Updates are disabled in demo mode." },
      { status: 403 }
    );
  }

  try {
    const supabase = getServerClient();
    const body = await request.json();

    const { data, error } = await supabase
      .from("proposals")
      .update(body)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ proposal: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
