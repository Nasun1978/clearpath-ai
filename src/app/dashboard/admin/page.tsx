"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { AdminStatsResponse, AdminUserRow } from "@/app/api/admin/stats/route";

export default function AdminPage() {
  const [data, setData] = useState<AdminStatsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(async (r) => {
        const json = await r.json() as AdminStatsResponse & { error?: string };
        if (!r.ok) {
          setError((json.error as string) ?? "Failed to load");
        } else {
          setData(json);
        }
      })
      .catch(() => setError("Request failed"))
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
              <span className="text-slate-500 text-sm font-normal ml-2">admin@clearpath.ai only</span>
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
              ? "Access denied. This page is restricted to admin@clearpath.ai."
              : error}
          </div>
        )}

        {data && (
          <>
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
          </>
        )}
      </main>
    </div>
  );
}
