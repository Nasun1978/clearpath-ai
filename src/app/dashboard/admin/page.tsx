"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AdminStatsResponse, AdminUserRow } from "@/app/api/admin/stats/route";

interface EncryptionStatus {
  configured: boolean;
  fingerprint: string | null;
  algorithm: string;
  keyDerivation: string;
  protectedTables: { table: string; fields: string[] }[];
}

export default function AdminPage() {
  const [data, setData] = useState<AdminStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [enc, setEnc] = useState<EncryptionStatus | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/encryption").then((r) => r.json()),
    ]).then(([stats, encStatus]) => {
      if (stats.error) setError(stats.error ?? "Failed to load");
      else setData(stats as AdminStatsResponse);
      if (!encStatus.error) setEnc(encStatus as EncryptionStatus);
    }).catch(() => setError("Request failed"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-400 hover:text-white text-sm">
              Back
            </Link>
            <h1 className="text-lg font-bold">
              <span className="text-red-400">Admin</span>
              <span className="text-slate-500 text-sm font-normal ml-2">restricted access</span>
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {loading && (
          <div className="text-center py-20 text-slate-500">Loading...</div>
        )}

        {error && (
          <div className="p-4 bg-red-900/20 border border-red-700/40 rounded-xl text-red-300 text-sm">
            {error === "Forbidden"
              ? "Access denied. This page is restricted to authorized admin accounts."
              : error}
          </div>
        )}

        {data && (
          <>
            {/* LIHTC Pipeline shortcut */}
            <Link
              href="/dashboard/admin/lihtc-pipeline"
              className="flex items-center justify-between bg-gradient-to-r from-amber-950/40 to-orange-950/30 border border-amber-800/40 rounded-xl px-5 py-4 hover:border-amber-700/60 transition-colors group"
            >
              <div>
                <p className="text-sm font-bold text-amber-300">LIHTC Pipeline Tracker</p>
                <p className="text-xs text-amber-600/80 mt-0.5">275 Houston properties · Map + deal tracking · Sell data to developers</p>
              </div>
              <svg className="w-5 h-5 text-amber-500 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>

            {/* Totals */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Registered Users", value: data.totals.users },
                { label: "Total Projects", value: data.totals.projects },
                { label: "Total Deals", value: data.totals.deals },
                { label: "Total Checklists", value: data.totals.checklists },
              ].map((s) => (
                <div key={s.label} className="bg-[#0F1729] border border-slate-800 rounded-xl p-5">
                  <div className="text-3xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                    {s.value}
                  </div>
                  <div className="text-sm text-slate-400 mt-1">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Users table */}
            <div className="bg-[#0F1729] border border-slate-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-slate-300">All Users</h2>
              </div>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-red-400 uppercase tracking-wider">Email</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-red-400 uppercase tracking-wider">Signed Up</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-red-400 uppercase tracking-wider">Projects</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-red-400 uppercase tracking-wider">Deals</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-red-400 uppercase tracking-wider">Checklists</th>
                  </tr>
                </thead>
                <tbody>
                  {data.users.map((u: AdminUserRow, i: number) => (
                    <tr
                      key={u.id}
                      className={`border-b border-slate-800/50 ${i % 2 === 0 ? "bg-[#0B1222]/30" : ""}`}
                    >
                      <td className="px-5 py-3">
                        <div className="text-sm text-white">{u.email}</div>
                        <div className="text-xs text-slate-600 font-mono">{u.id}</div>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-400">
                        {new Date(u.created_at).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-sm font-semibold ${u.projects > 0 ? "text-white" : "text-slate-600"}`}>
                          {u.projects}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-sm font-semibold ${u.deals > 0 ? "text-white" : "text-slate-600"}`}>
                          {u.deals}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className={`text-sm font-semibold ${u.checklists > 0 ? "text-white" : "text-slate-600"}`}>
                          {u.checklists}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {data.users.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-slate-500">
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {/* Encryption Status */}
            {enc && (
              <div className="bg-[#0F1729] border border-slate-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <h2 className="text-sm font-semibold text-slate-300">Field-Level Encryption</h2>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    enc.configured
                      ? "bg-teal-900/40 text-teal-300 border-teal-700/50"
                      : "bg-red-900/40 text-red-300 border-red-700/50"
                  }`}>
                    {enc.configured ? "ACTIVE" : "NOT CONFIGURED"}
                  </span>
                </div>

                <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Key details */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Master Key</p>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                        <span className="text-xs text-slate-500">Algorithm</span>
                        <span className="text-xs font-mono text-teal-300">{enc.algorithm}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                        <span className="text-xs text-slate-500">Key Derivation</span>
                        <span className="text-xs font-mono text-teal-300">{enc.keyDerivation}</span>
                      </div>
                      <div className="flex items-center justify-between py-2 border-b border-slate-800/60">
                        <span className="text-xs text-slate-500">Key Fingerprint</span>
                        <span className="text-xs font-mono text-slate-300">
                          {enc.fingerprint ? `${enc.fingerprint}…` : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-xs text-slate-500">Storage</span>
                        <span className="text-xs text-slate-300">Vercel env var</span>
                      </div>
                    </div>
                    {!enc.configured && (
                      <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-xl">
                        <p className="text-xs text-red-300 leading-relaxed">
                          <span className="font-semibold">Action required:</span> Set{" "}
                          <code className="font-mono bg-red-950/50 px-1 rounded">ENCRYPTION_MASTER_KEY</code>{" "}
                          in Vercel → Settings → Environment Variables. Generate with:{" "}
                          <code className="font-mono bg-red-950/50 px-1 rounded">
                            node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;
                          </code>
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Protected tables */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Protected Tables</p>
                    <div className="space-y-2">
                      {enc.protectedTables.map((t) => (
                        <div key={t.table} className="flex items-start justify-between py-2 border-b border-slate-800/60">
                          <span className="text-xs font-mono text-slate-300">{t.table}</span>
                          <span className="text-xs text-slate-500 text-right">{t.fields.join(", ")}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      Each user&apos;s fields are encrypted with a unique key derived from the master key + their user ID.
                      Only you can decrypt data from all users.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
