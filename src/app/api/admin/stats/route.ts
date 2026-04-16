import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, createServerClient } from "@/lib/supabase";

const ADMIN_EMAIL = "admin@ripespot.com";

export interface AdminUserRow {
  id: string;
  email: string;
  created_at: string;
  projects: number;
  deals: number;
  checklists: number;
}

export interface AdminStatsResponse {
  totals: {
    users: number;
    projects: number;
    deals: number;
    checklists: number;
  };
  users: AdminUserRow[];
}

// GET /api/admin/stats — aggregate stats across all users.
// Restricted to admin@ripespot.com only; uses service role to bypass RLS.
export async function GET(request: NextRequest) {
  const { user } = await getUserFromRequest(request);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.email !== ADMIN_EMAIL) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    // Service role client — bypasses RLS so we can see all rows across all users.
    const admin = createServerClient();

    // Fetch all auth users (up to 1000; sufficient for MVP scale)
    const { data: authData, error: usersError } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (usersError) return NextResponse.json({ error: usersError.message }, { status: 500 });

    // Fetch just the owner columns — we only need counts, not full rows
    const [projectsRes, dealsRes, checklistsRes] = await Promise.all([
      admin.from("projects").select("user_id"),
      admin.from("deals").select("user_id"),
      admin.from("lihtc_checklist").select("created_by"),
    ]);

    if (projectsRes.error) return NextResponse.json({ error: projectsRes.error.message }, { status: 500 });
    if (dealsRes.error) return NextResponse.json({ error: dealsRes.error.message }, { status: 500 });
    if (checklistsRes.error) return NextResponse.json({ error: checklistsRes.error.message }, { status: 500 });

    const projectCounts = countByKey(
      (projectsRes.data ?? []) as { user_id: string | null }[],
      "user_id"
    );
    const dealCounts = countByKey(
      (dealsRes.data ?? []) as { user_id: string | null }[],
      "user_id"
    );
    const checklistCounts = countByKey(
      (checklistsRes.data ?? []) as { created_by: string | null }[],
      "created_by"
    );

    const users: AdminUserRow[] = authData.users.map((u) => ({
      id: u.id,
      email: u.email ?? "(no email)",
      created_at: u.created_at,
      projects: projectCounts[u.id] ?? 0,
      deals: dealCounts[u.id] ?? 0,
      checklists: checklistCounts[u.id] ?? 0,
    }));

    // Sort most recently signed up first
    users.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const response: AdminStatsResponse = {
      totals: {
        users: users.length,
        projects: (projectsRes.data ?? []).length,
        deals: (dealsRes.data ?? []).length,
        checklists: (checklistsRes.data ?? []).length,
      },
      users,
    };

    return NextResponse.json(response);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

function countByKey(
  rows: { [key: string]: string | null }[],
  field: string
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const row of rows) {
    const key = row[field];
    if (key != null) map[key] = (map[key] ?? 0) + 1;
  }
  return map;
}
