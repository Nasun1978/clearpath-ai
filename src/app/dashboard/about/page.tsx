import Link from "next/link";

const FEATURES = [
  {
    title: "Zoning Lookup",
    desc: "Instantly see zoning classifications, overlays, and permitted uses for addresses across New Orleans, Baton Rouge, and Houston.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    ),
  },
  {
    title: "Deal Pipeline",
    desc: "Track and manage your development deals from prospecting through closing with a visual Kanban board.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
    ),
  },
  {
    title: "Project Tracking",
    desc: "Monitor your projects through every phase of development with timelines and budgets.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    ),
  },
  {
    title: "Financial Analysis",
    desc: "Upload your tax credit development pro forma and instantly see key feasibility metrics like TDC, NOI, DSCR, and cash-on-cash returns.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    ),
  },
  {
    title: "HUD HOME Compliance Guide",
    desc: "Interactive reference for affordability periods, Davis-Bacon requirements, income targeting, and property standards.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
  },
  {
    title: "LIHTC Application Checklist",
    desc: "110-item interactive checklist based on the LHC 2025 QAP, with document upload capability and progress tracking.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    ),
  },
  {
    title: "PILOT Analysis",
    desc: "Tools for government partners to evaluate Payment In Lieu of Taxes incentives.",
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Back
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-sm text-slate-400">About RipeSpot</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-16">

        {/* Hero */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold font-serif tracking-tight">
            About <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">RipeSpot</span>
          </h1>
          <p className="text-lg text-slate-400 font-light">Building better communities, together.</p>
        </section>

        {/* Founder's Story */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-teal-700" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-500">Founder&apos;s Story</h2>
          </div>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              My name is Steven Kennedy, and I built RipeSpot to make the real estate development process more accessible,
              transparent, and efficient.
            </p>
            <p>
              I&apos;m an urban planner and real estate developer, but my journey into this work started long before any
              degree or credential. I grew up in a community shaped by poverty — where disinvestment was visible on every
              block, opportunity felt distant, and the systems meant to help were difficult to navigate. That experience
              planted something in me: a deep belief that the places we live in shape the lives we lead, and that everyone
              deserves to live in a community built with care and intention.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-teal-700" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-500">Our Mission</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            That belief drives everything we do at RipeSpot. Our mission is to help create vibrant, sustainable
            communities — the kind of neighborhoods where families can thrive, businesses can grow, and people feel
            proud to call home.
          </p>
        </section>

        {/* The Problem */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-teal-700" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-500">The Problem We&apos;re Solving</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            The development process is unnecessarily complex. Between navigating zoning regulations, assembling tax
            credit applications, tracking compliance requirements, running financial analyses, and managing deal flow
            — developers spend more time buried in paperwork than actually building. Critical information is scattered
            across spreadsheets, government websites, and filing cabinets. Decisions get delayed. Opportunities get missed.
          </p>
        </section>

        {/* Solution */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-teal-700" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-500">Our Solution</h2>
          </div>
          <p className="text-slate-300 leading-relaxed">
            RipeSpot is a centralized platform designed to democratize the real estate development process. Our goal
            is simple: give developers the tools and information they need — all in one place — so they can make
            faster, smarter decisions and focus on what matters most — building communities.
          </p>
        </section>

        {/* Feature Cards */}
        <section className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-px bg-teal-700" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-500">What RipeSpot Offers</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-[#0F1729] border border-slate-800 rounded-xl p-5 flex gap-4">
                <div className="shrink-0 w-9 h-9 rounded-lg bg-teal-900/30 border border-teal-800/40 flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-teal-400 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {f.icon}
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white mb-1">{f.title}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section className="bg-teal-950/20 border border-teal-800/30 rounded-2xl px-6 py-5 flex gap-4 items-start">
          <div className="shrink-0 w-9 h-9 rounded-lg bg-teal-900/40 border border-teal-700/40 flex items-center justify-center">
            <svg className="w-5 h-5 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-teal-200 mb-1">Your Data Stays Private</p>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every user gets their own secure workspace. Your projects, deals, and documents are private and visible only to you.
            </p>
          </div>
        </section>

        {/* CTA / Contact */}
        <section className="border-t border-slate-800 pt-12 space-y-6 text-center">
          <p className="text-slate-400 text-sm leading-relaxed">
            Have questions or feedback? Email me directly at{" "}
            <a
              href="mailto:steven@ripespotdevelopment.com?subject=RipeSpot%20Question"
              className="text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
            >
              steven@ripespotdevelopment.com
            </a>
          </p>

          {/* Signature */}
          <div className="inline-block text-left bg-[#0F1729] border border-slate-800 rounded-xl px-6 py-5">
            <p className="text-white font-semibold">Steven Kennedy</p>
            <p className="text-teal-400 text-sm mt-0.5">Founder, RipeSpot</p>
            <p className="text-slate-500 text-xs mt-0.5">Urban Planner &amp; Real Estate Developer</p>
          </div>
        </section>

      </main>
    </div>
  );
}
