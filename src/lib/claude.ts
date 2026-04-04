// ============================================================================
// Claude API Integration
// ============================================================================
// This module handles all communication with the Anthropic Claude API.
// It is used exclusively on the server side (API routes).
// ============================================================================

import Anthropic from "@anthropic-ai/sdk";
import type { AIAnalysisResponse, Proposal } from "@/types";
import { buildCompliancePrompt } from "./compliance-prompts";
import { buildQapPrompt } from "./qap-prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Default model — Sonnet for speed/cost, Opus for complex analysis
const DEFAULT_MODEL = "claude-sonnet-4-6";

/**
 * Run full compliance analysis on a proposal.
 * Returns structured compliance check results and QAP scores.
 */
export async function analyzeProposal(
  proposal: Proposal,
  model: string = DEFAULT_MODEL
): Promise<AIAnalysisResponse> {
  const systemPrompt = buildCompliancePrompt(proposal);
  const userMessage = buildProposalDataMessage(proposal);

  const response = await anthropic.messages.create({
    model,
    max_tokens: 8000,
    temperature: 0, // Deterministic for compliance — we want consistent results
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  // Extract text content from response
  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude API");
  }

  // Parse JSON response — Claude should return pure JSON per our prompt
  const parsed = parseAIResponse(textBlock.text);
  return parsed;
}

/**
 * Run QAP-specific scoring for a given state.
 * Separated from compliance analysis because QAP criteria are state-specific
 * and change annually.
 */
export async function scoreQap(
  proposal: Proposal,
  state: string,
  qapYear: number,
  model: string = DEFAULT_MODEL
): Promise<AIAnalysisResponse["qap_scores"]> {
  const systemPrompt = buildQapPrompt(state, qapYear);
  const userMessage = buildProposalDataMessage(proposal);

  const response = await anthropic.messages.create({
    model,
    max_tokens: 4000,
    temperature: 0,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text response from Claude API for QAP scoring");
  }

  const parsed = JSON.parse(cleanJsonResponse(textBlock.text));
  return parsed.qap_scores || parsed;
}

/**
 * Build the user message containing all proposal data.
 * This is sent as the user turn to Claude alongside the system prompt.
 */
function buildProposalDataMessage(proposal: Proposal): string {
  return `Analyze the following affordable housing development proposal:

${JSON.stringify(
  {
    project_name: proposal.project_name,
    project_address: proposal.project_address,
    city: proposal.city,
    county: proposal.county,
    state: proposal.state,

    credit_type: proposal.credit_type,
    set_aside_election: proposal.set_aside_election,
    is_new_construction: proposal.is_new_construction,
    is_rehab: proposal.is_rehab,

    total_units: proposal.total_units,
    affordable_units: proposal.affordable_units,
    market_rate_units: proposal.market_rate_units,
    ami_breakdown: {
      "30_pct": proposal.ami_30_pct_units,
      "50_pct": proposal.ami_50_pct_units,
      "60_pct": proposal.ami_60_pct_units,
      "80_pct": proposal.ami_80_pct_units,
      "120_pct": proposal.ami_120_pct_units,
    },

    total_development_cost: proposal.total_development_cost,
    eligible_basis: proposal.eligible_basis,
    qualified_basis: proposal.qualified_basis,
    bond_amount: proposal.bond_amount,
    annual_credit_amount: proposal.annual_credit_amount,
    credit_price: proposal.credit_price,
    tax_credit_equity: proposal.tax_credit_equity,

    permanent_loan_amount: proposal.permanent_loan_amount,
    permanent_loan_rate: proposal.permanent_loan_rate,
    permanent_loan_term: proposal.permanent_loan_term,
    dscr: proposal.dscr,

    developer_fee: proposal.developer_fee,
    developer_fee_pct: proposal.developer_fee_pct,
    deferred_developer_fee: proposal.deferred_developer_fee,

    is_qct: proposal.is_qct,
    is_dda: proposal.is_dda,
    is_opportunity_zone: proposal.is_opportunity_zone,
    fema_flood_zone: proposal.fema_flood_zone,
    zoning_designation: proposal.zoning_designation,

    qap_state: proposal.qap_state,
    qap_year: proposal.qap_year,
  },
  null,
  2
)}

Return your analysis as valid JSON only. No preamble, no markdown fences.`;
}

/**
 * Parse and validate the AI response.
 * Handles cases where Claude wraps JSON in markdown code fences.
 */
function parseAIResponse(rawText: string): AIAnalysisResponse {
  const cleaned = cleanJsonResponse(rawText);

  try {
    const parsed = JSON.parse(cleaned);

    // Validate required fields exist
    if (!parsed.compliance_checks || !Array.isArray(parsed.compliance_checks)) {
      throw new Error("Response missing compliance_checks array");
    }

    return {
      compliance_checks: parsed.compliance_checks,
      qap_scores: parsed.qap_scores || [],
      summary: parsed.summary || "",
    };
  } catch (error) {
    console.error("Failed to parse AI response:", rawText.substring(0, 500));
    throw new Error(
      `Failed to parse Claude API response: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

/**
 * Strip markdown code fences and whitespace from JSON responses.
 */
function cleanJsonResponse(text: string): string {
  return text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/gi, "")
    .trim();
}
