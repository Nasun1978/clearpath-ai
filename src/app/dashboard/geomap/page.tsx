"use client";

import Link from "next/link";
import { useState } from "react";

export default function GeomapPage() {
  const [iframeError, setIframeError] = useState(false);

  return (
    <div className="min-h-screen bg-[#080E1A] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-serif tracking-tight">
              RipeSpot
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 tracking-wide uppercase">
              Real Estate Development Platform
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Link href="/dashboard/about" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
              About
            </Link>
            <Link href="/dashboard/deals" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
              Deal Pipeline
            </Link>
            <Link href="/dashboard/projects" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
              Projects
            </Link>
            <Link href="/dashboard/financial" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
              Financial Analysis
            </Link>
            <Link href="/dashboard/zoning" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
              Zoning Lookup
            </Link>
            <Link href="/dashboard/compliance" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors">
              HOME Compliance
            </Link>
            <Link href="/dashboard/checklist" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-900/40 text-teal-300 hover:bg-teal-800/50 border border-teal-800/50 transition-colors">
              LIHTC Checklist
            </Link>
            <Link href="/dashboard/pilot-analysis" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-900/40 text-purple-300 hover:bg-purple-800/50 border border-purple-800/50 transition-colors">
              PILOT Analysis
            </Link>
            <Link href="/dashboard/geomap" className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-900/40 text-blue-300 hover:bg-blue-800/50 border border-blue-800/50 transition-colors flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Geomap
            </Link>
            <a
              href="mailto:steven@ripespotdevelopment.com?subject=RipeSpot%20Question"
              className="p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors"
              aria-label="Contact support"
              title="Contact Support"
            >
              <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </a>
            <a
              href="/submit"
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-brand text-white hover:bg-brand-light transition-colors"
            >
              + New Proposal
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Page title & description */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-900/40 border border-blue-800/50">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold font-serif tracking-tight">FFIEC Geocoding / Mapping System</h2>
          </div>
          <p className="text-sm text-slate-400 leading-relaxed max-w-4xl">
            Look up census tract demographics, income levels, minority population data, and underserved area
            designations critical for LIHTC scoring, CRA credit, and HUD funding eligibility.
          </p>
        </div>

        {/* Context cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
            <div className="w-7 h-7 rounded-lg bg-teal-900/40 border border-teal-800/50 flex items-center justify-center mb-3">
              <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-200 mb-1">Census Tract Income</p>
            <p className="text-[11px] text-slate-500 leading-snug">Low, Moderate, Middle, and Upper income designations by tract for CRA and HOME eligibility.</p>
          </div>

          <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
            <div className="w-7 h-7 rounded-lg bg-amber-900/40 border border-amber-800/50 flex items-center justify-center mb-3">
              <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-200 mb-1">Minority Population</p>
            <p className="text-[11px] text-slate-500 leading-snug">Minority percentage data by census tract, relevant for affirmatively furthering fair housing analysis.</p>
          </div>

          <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
            <div className="w-7 h-7 rounded-lg bg-red-900/40 border border-red-800/50 flex items-center justify-center mb-3">
              <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-200 mb-1">Distressed / Underserved</p>
            <p className="text-[11px] text-slate-500 leading-snug">FFIEC distressed and underserved tract designations that can boost QAP scoring points.</p>
          </div>

          <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
            <div className="w-7 h-7 rounded-lg bg-blue-900/40 border border-blue-800/50 flex items-center justify-center mb-3">
              <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-200 mb-1">Qualified Census Tracts</p>
            <p className="text-[11px] text-slate-500 leading-snug">QCT designation (IRC §42) provides a 130% eligible basis boost for LIHTC projects.</p>
          </div>

          <div className="bg-[#0F1729] border border-slate-800 rounded-xl p-4">
            <div className="w-7 h-7 rounded-lg bg-purple-900/40 border border-purple-800/50 flex items-center justify-center mb-3">
              <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
              </svg>
            </div>
            <p className="text-xs font-semibold text-slate-200 mb-1">Difficult Dev. Areas</p>
            <p className="text-[11px] text-slate-500 leading-snug">DDA designation (IRC §42) also provides a 130% eligible basis boost based on high construction costs.</p>
          </div>
        </div>

        {/* Iframe + fallback */}
        <div className="bg-[#0F1729] border border-slate-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wide">FFIEC Geocoding / Mapping System</span>
            </div>
            <a
              href="https://geomap.ffiec.gov/ffiecgeomap/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Open in new tab
            </a>
          </div>

          {iframeError ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-6">
              <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <svg className="w-6 h-6 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-300 mb-1">Iframe blocked by FFIEC security headers</p>
                <p className="text-xs text-slate-500 max-w-sm">The FFIEC site restricts embedding. Open it directly in a new tab to use the geocoding tool.</p>
              </div>
              <a
                href="https://geomap.ffiec.gov/ffiecgeomap/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-teal-700 text-white hover:bg-teal-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open FFIEC Geomap
              </a>
            </div>
          ) : (
            <iframe
              src="https://geomap.ffiec.gov/ffiecgeomap/"
              title="FFIEC Geocoding / Mapping System"
              className="w-full border-0"
              style={{ height: "80vh" }}
              onError={() => setIframeError(true)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          )}
        </div>
      </main>

      <footer className="border-t border-slate-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} RipeSpot. All rights reserved.
          </p>
          <a
            href="mailto:steven@ripespotdevelopment.com?subject=RipeSpot%20Question"
            className="text-xs text-slate-600 hover:text-slate-400 transition-colors"
          >
            Support
          </a>
        </div>
      </footer>
    </div>
  );
}
