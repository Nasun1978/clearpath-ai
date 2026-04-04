# ClearPath AI — Project Context for Claude Code

## Overview
ClearPath AI is an agentic AI platform for affordable housing compliance review. It helps government agencies (housing authorities, state HFAs, HUD offices) evaluate LIHTC, HOME, HTF, and CDBG development proposals.

## Tech Stack
- Next.js 14+ with App Router (TypeScript)
- Supabase (PostgreSQL, Auth, Storage)
- Claude API (Anthropic) for compliance analysis
- Tailwind CSS for styling
- Deployed on Vercel

## Commands
- `npm run dev` — Start development server on port 3000
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run type-check` — TypeScript strict mode check

## Architecture Rules
- All API routes are in `src/app/api/` using Next.js Route Handlers
- Server components by default; use "use client" only for interactive components
- All database access goes through Supabase client in `src/lib/supabase.ts`
- All Claude API calls go through `src/lib/claude.ts`
- Compliance prompts are in `src/lib/compliance-prompts.ts` — these encode domain expertise and are the product's core IP
- Types in `src/types/index.ts` must match the Supabase database schema exactly

## Conventions
- TypeScript strict mode; no `any` types
- Use server actions for mutations when possible
- All monetary values stored as numbers (not strings) in cents or with NUMERIC(14,2)
- Regulatory citations must use proper format: "IRC §42(h)(4)(B)" not "Section 42h4B"
- Error handling: always return structured error responses from API routes
- Comments should explain WHY, not what — especially in compliance logic
- Commit messages: imperative mood, < 72 chars

## Domain Terms
- LIHTC = Low-Income Housing Tax Credit (IRC Section 42)
- QAP = Qualified Allocation Plan (state-specific scoring criteria)
- TDHCA = Texas Department of Housing and Community Affairs
- LHC = Louisiana Housing Corporation
- MTSP = Multifamily Tax Subsidy Project (HUD rent limits)
- TDC = Total Development Cost
- HCC = High Cost Correction (HUD cost adjustment)
- DSCR = Debt Service Coverage Ratio
- QCT = Qualified Census Tract (130% basis boost)
- DDA = Difficult Development Area (130% basis boost)
- SDE = Seller's Discretionary Earnings
- PHA = Public Housing Authority
- RAD = Rental Assistance Demonstration
- TEFRA = Tax Equity and Fiscal Responsibility Act (public hearing requirement)

## Important Files
- `src/lib/compliance-prompts.ts` — THE core IP. The system prompts that encode affordable housing compliance expertise. Treat with extreme care.
- `src/lib/qap-prompts.ts` — State-specific QAP scoring prompts. Must be updated annually when QAPs change.
- `clearpath_supabase_schema.sql` — Complete database schema. Run in Supabase SQL Editor.
- `src/types/index.ts` — TypeScript types that mirror the database schema.
