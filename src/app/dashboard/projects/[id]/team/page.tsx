"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { TeamMember, TeamMemberRole, Project } from "@/types";
import { TEAM_MEMBER_ROLES } from "@/types";

// ── Role badge colors ─────────────────────────────────────────────────────────

function getRoleBadgeClass(role: string): string {
  if (role === "Developer" || role === "Co-Developer")     return "bg-teal-900/40 text-teal-300 border-teal-700/40";
  if (role === "Architect")                                return "bg-blue-900/40 text-blue-300 border-blue-700/40";
  if (role.includes("Engineer"))                           return "bg-indigo-900/40 text-indigo-300 border-indigo-700/40";
  if (role === "General Contractor")                       return "bg-cyan-900/40 text-cyan-300 border-cyan-700/40";
  if (role === "Attorney")                                 return "bg-purple-900/40 text-purple-300 border-purple-700/40";
  if (role === "Lender")                                   return "bg-amber-900/40 text-amber-300 border-amber-700/40";
  if (role === "Tax Credit Syndicator" || role === "Accountant") return "bg-emerald-900/40 text-emerald-300 border-emerald-700/40";
  if (role === "Market Analyst" || role === "Appraiser")   return "bg-orange-900/40 text-orange-300 border-orange-700/40";
  return "bg-slate-800 text-slate-400 border-slate-700/40";
}

// ── Avatar ────────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  "bg-teal-700", "bg-blue-700", "bg-purple-700", "bg-amber-700",
  "bg-emerald-700", "bg-indigo-700", "bg-pink-700", "bg-orange-700",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ── Empty form ────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  full_name: "",
  email: "",
  phone: "",
  role: "Developer" as TeamMemberRole,
  company: "",
  notes: "",
};

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { id: projectId } = useParams<{ id: string }>();

  const [project, setProject]   = useState<Project | null>(null);
  const [members, setMembers]   = useState<TeamMember[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<TeamMember | null>(null);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError]   = useState<string | null>(null);
  const [deleteId, setDeleteId]     = useState<string | null>(null);

  // Load project + members
  useEffect(() => {
    if (!projectId) return;
    async function load() {
      const [projRes, membersRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`),
        fetch(`/api/team-members?project_id=${projectId}`),
      ]);
      if (projRes.ok) {
        const d = await projRes.json() as { project: Project };
        setProject(d.project);
      }
      if (membersRes.ok) {
        const d = await membersRes.json() as { members: TeamMember[] };
        setMembers(d.members ?? []);
      }
      setLoading(false);
    }
    load();
  }, [projectId]);

  function openAdd() {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setFormError(null);
    setShowModal(true);
  }

  function openEdit(m: TeamMember) {
    setEditTarget(m);
    setForm({
      full_name: m.full_name,
      email:     m.email,
      phone:     m.phone ?? "",
      role:      m.role,
      company:   m.company ?? "",
      notes:     m.notes ?? "",
    });
    setFormError(null);
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      let res: Response;
      if (editTarget) {
        res = await fetch(`/api/team-members/${editTarget.id}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: form.full_name,
            email:     form.email,
            phone:     form.phone || null,
            role:      form.role,
            company:   form.company || null,
            notes:     form.notes || null,
          }),
        });
        const d = await res.json() as { member?: TeamMember; error?: string };
        if (!res.ok) { setFormError(d.error ?? "Update failed"); return; }
        setMembers((prev) => prev.map((m) => m.id === editTarget.id ? d.member! : m));
      } else {
        res = await fetch("/api/team-members", {
          method:  "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, project_id: projectId }),
        });
        const d = await res.json() as { member?: TeamMember; error?: string };
        if (!res.ok) { setFormError(d.error ?? "Create failed"); return; }
        setMembers((prev) => [...prev, d.member!]);
      }
      setShowModal(false);
    } catch {
      setFormError("Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteId(id);
    try {
      await fetch(`/api/team-members/${id}`, { method: "DELETE" });
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } finally {
      setDeleteId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#080E1A] text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-[#080E1A]/90 backdrop-blur-sm sticky top-0 z-20 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/dashboard/projects" className="text-slate-400 hover:text-white text-sm shrink-0">
              ← Projects
            </Link>
            <span className="text-slate-700">·</span>
            <div className="min-w-0">
              <h1 className="text-lg font-bold text-white truncate">
                {project ? project.name : "Loading…"}
              </h1>
              {project && (
                <p className="text-xs text-slate-500 -mt-0.5">Team Management</p>
              )}
            </div>
          </div>
          <button
            onClick={openAdd}
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-500 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Member
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading team…</div>
        ) : members.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-14 h-14 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-slate-400 font-semibold mb-1">No team members yet</p>
            <p className="text-sm text-slate-600 mb-5">Add developers, consultants, and other project partners.</p>
            <button
              onClick={openAdd}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-500 transition-colors"
            >
              Add First Member
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-6">
              {members.length} team member{members.length !== 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {members.map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  onEdit={() => openEdit(m)}
                  onDelete={() => handleDelete(m.id)}
                  deleting={deleteId === m.id}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Add / Edit modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#0F1729] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-white">
                {editTarget ? "Edit Team Member" : "Add Team Member"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {formError && (
                <div className="p-3 bg-red-900/20 border border-red-700/40 rounded-lg text-sm text-red-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">
                    Full Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    value={form.full_name}
                    onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                    placeholder="Jane Smith"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="jane@firm.com"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="(504) 555-0100"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Role <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={form.role}
                    onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as TeamMemberRole }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
                  >
                    {TEAM_MEMBER_ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Company</label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                    placeholder="Firm or organization"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="e.g. Lead architect for building A; copy on all site plan revisions"
                    rows={2}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-lg text-sm font-semibold bg-teal-600 text-white hover:bg-teal-500 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Saving…" : editTarget ? "Save Changes" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Member card ───────────────────────────────────────────────────────────────

function MemberCard({
  member, onEdit, onDelete, deleting,
}: {
  member: TeamMember;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const initials   = getInitials(member.full_name);
  const avatarColor = getAvatarColor(member.full_name);

  return (
    <div className="bg-[#0F1729] border border-slate-800 rounded-2xl p-5 flex flex-col gap-3 hover:border-slate-700 transition-colors">
      {/* Avatar + name + role */}
      <div className="flex items-start gap-3">
        <div className={`shrink-0 w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-sm font-bold text-white`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-white leading-tight truncate">{member.full_name}</p>
          {member.company && (
            <p className="text-xs text-slate-500 truncate">{member.company}</p>
          )}
        </div>
        <span className={`shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getRoleBadgeClass(member.role)}`}>
          {member.role}
        </span>
      </div>

      {/* Contact links */}
      <div className="flex flex-col gap-1.5">
        <a
          href={`mailto:${member.email}`}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-teal-400 transition-colors truncate"
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="truncate">{member.email}</span>
        </a>
        {member.phone && (
          <a
            href={`tel:${member.phone}`}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-teal-400 transition-colors"
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {member.phone}
          </a>
        )}
      </div>

      {/* Notes */}
      {member.notes && (
        <p className="text-xs text-slate-500 italic leading-snug border-t border-slate-800 pt-2">
          {member.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 mt-auto border-t border-slate-800">
        <button
          onClick={onEdit}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={deleting}
          className="flex items-center gap-1 text-xs text-slate-600 hover:text-red-400 disabled:opacity-50 transition-colors ml-auto"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          {deleting ? "Removing…" : "Remove"}
        </button>
      </div>
    </div>
  );
}
