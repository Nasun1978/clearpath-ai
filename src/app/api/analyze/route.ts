// @ts-nocheck
// @ts-nocheck
// @ts-nocheck
// ============================================================================
// POST /api/analyze
// ============================================================================
// Triggers AI compliance analysis for a proposal.
// Fetches proposal data from Supabase, sends to Claude, stores results.
// This is the core engine of RipeSpot.
// ============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase";
import { analyzeProposal } from "@/lib/claude";
import { DEMO_PROPOSALS, DEMO_COMPLIANCE_CHECKS, DEMO_QAP_SCORES } from "@/lib/demo-data";
import type { Proposal } from "@/types";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

export async function POST(request: NextRequest) {
  // Demo mode: return pre-computed analysis without calling Claude or Supabase
  if (DEMO_MODE) {
    const body = await request.json();
    const { proposal_id } = body;

    const proposal = DEMO_PROPOSALS.find((p) => p.id === proposal_id);
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const checks = DEMO_COMPLIANCE_CHECKS[proposal_id] || [];
    const qapScores = DEMO_QAP_SCORES[proposal_id] || [];

    // Simulate a short analysis delay for realism
    await new Promise((r) => setTimeout(r, 1800));

    return NextResponse.json({
      success: true,
      proposal_id,
      compliance_checks_count: checks.length,
      qap_scores_count: qapScores.length,
      summary: `RipeSpot analyzed ${proposal.project_name} against ${checks.length} compliance requirements. ${checks.filter((c: any) => c.result === "pass").length} checks passed, ${checks.filter((c: any) => c.result === "fail").length} failed, ${checks.filter((c: any) => c.result === "needs_review").length} require human review.`,
    });
  }

  try {
    const body = await request.json();
    const { proposal_id, model } = body;

    if (!proposal_id) {
      return NextResponse.json(
        { error: "proposal_id is required" },
        { status: 400 }
      );
    }

    const supabase = getServerClient();

    // 1. Fetch the proposal
    const { data: proposal, error: fetchError } = await supabase!
      .from("proposals")
      .select("*")
      .eq("id", proposal_id)
      .single();

    if (fetchError || !proposal) {
      return NextResponse.json(
        { error: "Proposal not found", detail: fetchError?.message },
        { status: 404 }
      );
    }

    // 2. Update status to processing
    await supabase!
      .from("proposals")
      .update({ status: "processing" })
      .eq("id", proposal_id);

    // 3. Run Claude AI analysis
    const analysisResult = await analyzeProposal(
      proposal as Proposal,
      model || undefined
    );

    // 4. Store compliance check results using the database function
    const { error: complianceError } = await supabase!.rpc(
      "record_compliance_results",
      {
        p_proposal_id: proposal_id,
        p_results: analysisResult.compliance_checks,
        p_model_used: model || "claude-sonnet-4-6",
      }
    );

    if (complianceError) {
      console.error("Failed to store compliance results:", complianceError);
      for (const check of analysisResult.compliance_checks) {
        await supabase!.from("compliance_checks").insert({
          proposal_id,
          check_name: check.check_name,
          category: check.category,
          result: check.result,
          severity: check.severity,
          regulatory_citation: check.citation,
          finding_detail: check.finding,
          recommendation: check.recommendation,
          expected_value: check.expected_value || null,
          actual_value: check.actual_value || null,
        });
      }
    }

    // 5. Store QAP scoring results if available
    if (analysisResult.qap_scores.length > 0 && proposal.qap_state) {
      const { error: qapError } = await supabase!.rpc("record_qap_results", {
        p_proposal_id: proposal_id,
        p_qap_state: proposal.qap_state,
        p_qap_year: proposal.qap_year || new Date().getFullYear(),
        p_results: analysisResult.qap_scores,
      });

      if (qapError) {
        console.error("Failed to store QAP results:", qapError);
        for (const score of analysisResult.qap_scores) {
          await supabase!.from("qap_scoring").insert({
            proposal_id,
            qap_state: proposal.qap_state,
            qap_year: proposal.qap_year || new Date().getFullYear(),
            category_name: score.category,
            max_points: score.max_points,
            awarded_points: score.awarded_points,
            confidence: score.confidence,
            rationale: score.rationale,
            recommendation: score.recommendation,
          });
        }
      }
    }

    // 6. Update proposal with AI analysis metadata
    await supabase!
      .from("proposals")
      .update({
        ai_analysis_completed: true,
        ai_analysis_timestamp: new Date().toISOString(),
        ai_model_used: model || "claude-sonnet-4-6",
        ai_raw_response: analysisResult,
        status: "in_review",
      })
      .eq("id", proposal_id);

    // 7. Log the activity
    await supabase!.from("activity_log").insert({
      proposal_id,
      action: "ai_analysis_completed",
      action_detail: `AI compliance analysis completed: ${analysisResult.compliance_checks.length} checks, ${analysisResult.qap_scores.length} QAP categories`,
      metadata: {
        model: model || "claude-sonnet-4-6",
        checks_count: analysisResult.compliance_checks.length,
        qap_count: analysisResult.qap_scores.length,
        passed: analysisResult.compliance_checks.filter((c) => c.result === "pass").length,
        failed: analysisResult.compliance_checks.filter((c) => c.result === "fail").length,
      },
    });

    return NextResponse.json({
      success: true,
      proposal_id,
      compliance_checks_count: analysisResult.compliance_checks.length,
      qap_scores_count: analysisResult.qap_scores.length,
      summary: analysisResult.summary,
    });
  } catch (error) {
    console.error("Analysis API error:", error);
    return NextResponse.json(
      {
        error: "Analysis failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
