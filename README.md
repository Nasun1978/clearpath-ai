# ClearPath AI — Affordable Housing Compliance Platform

## For the Developer Reading This

This codebase is the foundation for **ClearPath AI**, an agentic AI platform that helps government agencies evaluate affordable housing development proposals. It was designed by Steven Kennedy (REO, LLC), who has deep domain expertise in LIHTC, HUD programs, QAP compliance, and affordable housing finance. Your job is to turn this foundation into a production-ready platform.

**What this codebase includes:**
- Complete Next.js 14+ application with App Router
- Supabase integration (auth, database, storage)
- Claude API integration for AI-powered compliance analysis
- Full TypeScript type definitions matching the database schema
- API routes for all core operations
- Dashboard pages for reviewers and developers
- Compliance analysis engine with domain-specific prompts
- QAP scoring engine (TDHCA and LHC initially)
- Report generation pipeline

**What you'll need to build/extend:**
- Production deployment (Vercel recommended)
- Document OCR pipeline (Docparser or AWS Textract integration)
- Email notification system
- PDF report generation (use @react-pdf/renderer or Puppeteer)
- Additional state QAP modules beyond TX and LA
- StateRAMP/FedRAMP security hardening (Phase 3)

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14+ (App Router) | Server components, API routes, SSR |
| UI | Tailwind CSS + shadcn/ui | Rapid development, consistent design |
| Database | Supabase (PostgreSQL) | Auth, RLS, real-time, storage, auto-generated APIs |
| AI Engine | Claude API (Anthropic) | Best-in-class compliance reasoning |
| Auth | Supabase Auth | Built-in, RLS-integrated |
| File Storage | Supabase Storage | Integrated with auth policies |
| Deployment | Vercel | Zero-config Next.js hosting |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project (free at supabase.com)
- An Anthropic API key (console.anthropic.com)

### Setup

```bash
# Clone the repo
git clone <repo-url>
cd clearpath-ai

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Fill in your keys in .env.local (see below)

# Run the Supabase SQL schema
# Go to your Supabase project > SQL Editor > paste clearpath_supabase_schema.sql

# Start development server
npm run dev
```

### Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ANTHROPIC_API_KEY=your-anthropic-api-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Project Structure

```
clearpath-ai/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/                # API routes (server-side)
│   │   │   ├── analyze/        # Claude AI compliance analysis
│   │   │   ├── proposals/      # CRUD operations for proposals
│   │   │   ├── qap-score/      # QAP scoring endpoint
│   │   │   ├── dashboard-stats/ # Dashboard statistics
│   │   │   └── generate-report/ # PDF report generation
│   │   ├── login/              # Authentication page
│   │   ├── dashboard/          # Reviewer dashboard
│   │   │   └── proposals/[id]/ # Individual proposal detail
│   │   └── submit/             # Developer submission portal
│   ├── components/             # React components
│   │   ├── ui/                 # Base UI components (shadcn)
│   │   ├── layout/             # Header, sidebar, navigation
│   │   ├── proposals/          # Proposal-specific components
│   │   ├── compliance/         # Compliance check displays
│   │   └── qap/               # QAP scoring components
│   ├── lib/                    # Utilities and services
│   │   ├── supabase.ts         # Supabase client configuration
│   │   ├── claude.ts           # Claude API integration
│   │   ├── compliance-prompts.ts # Domain-specific AI prompts
│   │   ├── qap-prompts.ts     # QAP scoring prompts (per state)
│   │   └── utils.ts           # Helper functions
│   ├── types/                  # TypeScript type definitions
│   │   └── index.ts           # All types matching DB schema
│   └── hooks/                 # Custom React hooks
├── public/                    # Static assets
├── docs/                      # Architecture & API documentation
│   ├── ARCHITECTURE.md        # System design document
│   └── DATABASE.md            # Database schema reference
└── clearpath_supabase_schema.sql  # Database setup (run in Supabase SQL Editor)
```

---

## Domain Context (READ THIS)

ClearPath AI serves government agencies that review affordable housing proposals. Here's what you need to understand:

### What is LIHTC?
The Low-Income Housing Tax Credit (Section 42 of the IRC) is the primary federal program for producing affordable housing. Developers apply to state agencies for tax credits, which they sell to investors to raise equity for construction. There are two types:
- **9% credits**: Competitive, awarded through annual application rounds scored against the state's QAP
- **4% credits**: As-of-right, paired with tax-exempt private activity bonds. Must pass the "25% bond test"

### What is a QAP?
The Qualified Allocation Plan is each state's criteria for awarding LIHTC. It changes annually. Our initial targets:
- **TDHCA**: Texas Department of Housing and Community Affairs
- **LHC**: Louisiana Housing Corporation

### Key compliance checks the AI performs:
1. Income targeting (set-aside elections per IRC §42(g))
2. Rent restrictions (MTSP limits per §42(g)(2))
3. Eligible basis calculations (§42(d))
4. 25% bond test for 4% deals (§42(h)(4)(B))
5. Developer fee limits
6. HUD TDC/HCC cost limits
7. DSCR thresholds

### User roles:
- **Reviewer**: Agency staff who evaluate proposals (see all proposals for their agency)
- **Developer**: Applicants who submit proposals (see only their own)
- **Admin**: Full access, manage users and agencies

---

## Key Workflows

### 1. Proposal Submission
Developer fills form → Data saved to Supabase → Files uploaded to Storage → Status: "received"

### 2. AI Analysis
API route receives proposal ID → Fetches data from Supabase → Constructs compliance prompt → Sends to Claude API → Parses JSON response → Inserts compliance_checks and qap_scoring records → Updates proposal scores → Status: "in_review"

### 3. Reviewer Evaluation  
Reviewer opens dashboard → Sees proposal queue → Clicks proposal → Reviews AI findings → Can override individual checks → Approves/denies/requests deficiency

### 4. Report Generation
Reviewer clicks "Generate Report" → API fetches all proposal data → Generates formatted PDF → Saves to storage → Links to proposal record

---

## Contact

**Steven Kennedy**  
REO, LLC | Houston Housing Authority  
CDE Control #11NMC005902

This is a confidential codebase. Do not distribute without authorization.
