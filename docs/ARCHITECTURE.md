# ClearPath AI — System Architecture

## Data Flow

```
Developer submits proposal
        ↓
[Next.js Form / API] ──→ [Supabase DB] ──→ status: "received"
        ↓
[File Upload] ──→ [Supabase Storage] ──→ bucket: "proposal-documents"
        ↓
[POST /api/analyze] ──→ [Fetch proposal from DB]
        ↓
[Build compliance prompt] ──→ compliance-prompts.ts selects checks based on credit_type
        ↓
[Claude API call] ──→ model: claude-sonnet-4-6, temp: 0, max_tokens: 8000
        ↓
[Parse JSON response] ──→ Extract compliance_checks[] and qap_scores[]
        ↓
[Insert compliance_checks] ──→ Triggers recalculate_compliance_score()
[Insert qap_scoring]        ──→ Triggers recalculate_qap_score()
        ↓
[Update proposal] ──→ status: "in_review", ai_analysis_completed: true
        ↓
[Reviewer opens dashboard] ──→ Reads from v_proposal_dashboard view
        ↓
[Reviewer clicks proposal] ──→ Fetches via get_proposal_review() RPC
        ↓
[Reviewer approves/denies] ──→ Triggers log_proposal_status_change()
```

## Key Design Decisions

### Why Claude over OpenAI?
Claude's extended thinking and structured output capabilities produce more reliable compliance reasoning with proper regulatory citations. The 200K context window allows ingesting entire QAP documents for scoring.

### Why Supabase over Firebase?
PostgreSQL gives us relational integrity (foreign keys, ENUM types, generated columns), Row Level Security for government data isolation, and the ability to write complex database functions that auto-calculate scores and maintain audit trails.

### Why Next.js App Router?
Server components reduce client-side JavaScript, API routes run server-side (protecting the Anthropic API key), and the file-based routing maps cleanly to our page structure.

### Why temperature=0 for Claude calls?
Compliance analysis must be deterministic. Given the same proposal data, the system should produce the same compliance findings every time. temperature=0 achieves this.

## Security Considerations

- All API keys are server-side only (never exposed to the browser)
- Supabase RLS policies enforce role-based data access
- The service role key is used ONLY in API routes, never in client components
- Audit logging captures every status change and analysis event
- File uploads are restricted to approved MIME types and 50MB max

## Scaling Path

### Current (MVP): Single Supabase project
- Handles 50-100 concurrent proposals comfortably
- Supabase free tier: 500MB DB, 1GB storage, 2GB bandwidth

### Phase 2: Production
- Upgrade to Supabase Pro ($25/mo) for 8GB DB, 100GB storage
- Add Supabase Realtime for live dashboard updates
- Add edge functions for background processing

### Phase 3: Enterprise
- Migrate to AWS GovCloud for FedRAMP compliance
- Separate databases per agency (multi-tenant isolation)
- Add Redis for caching frequently-accessed proposal data
- Add queue system (BullMQ/SQS) for async analysis processing

## File Organization Rationale

- `src/lib/compliance-prompts.ts` — Isolated because it's the core IP and changes independently of the app code
- `src/lib/qap-prompts.ts` — Separated by state because QAPs change annually on different schedules
- `src/types/index.ts` — Single source of truth for all types, mirrors DB schema exactly
- `src/app/api/` — All server-side logic in API routes, keeping client components thin
