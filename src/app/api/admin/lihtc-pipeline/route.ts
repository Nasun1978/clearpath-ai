import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import { readFileSync } from "fs";
import { join } from "path";

const ADMIN_EMAILS = [
  "admin@ripespot.com",
  "steven@ripespotdevelopment.com",
  "stevenkennedy78@gmail.com",
];

// GET /api/admin/lihtc-pipeline — returns all pipeline properties (admin only)
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user?.email || !ADMIN_EMAILS.includes(user.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const filePath = join(process.cwd(), "src", "app", "api", "admin", "lihtc-pipeline", "data.json");
    const raw = readFileSync(filePath, "utf8");
    const properties = JSON.parse(raw) as unknown[];

    return NextResponse.json({ properties }, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load pipeline data" },
      { status: 500 }
    );
  }
}
