import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import { readFileSync } from "fs";
import { join } from "path";

// GET /api/templates/construction-draw — serves the construction draw request
// template (Excel) to authenticated users only.
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const filePath = join(process.cwd(), "src", "app", "api", "templates", "construction-draw", "template.xlsx");
    const fileBuffer = readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Construction_Draw_Template.xlsx"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to serve template" },
      { status: 500 }
    );
  }
}
