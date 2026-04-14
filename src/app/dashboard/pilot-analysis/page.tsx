"use client";
import Link from "next/link";

export default function PILOTAnalysisPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">Back</Link>
            <h1 className="text-lg font-bold">
              <span className="text-purple-400">PILOT</span> Public Benefit Analysis
            </h1>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-purple-600 border border-purple-900/50 bg-purple-950/30 px-2 py-0.5 rounded font-semibold">
            Gov
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-20 flex flex-col items-center justify-center text-center">
        <div className="w-14 h-14 rounded-2xl bg-purple-900/30 border border-purple-700/40 flex items-center justify-center mb-6">
          <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-2 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h2 className="text-xl font-bold font-serif text-white mb-3">PILOT Analysis Template Coming Soon</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          Check back later — an updated Public Benefit Analysis template will be available here shortly.
        </p>
      </main>
    </div>
  );
}
