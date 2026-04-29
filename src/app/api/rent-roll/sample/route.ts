import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";
import { readFileSync } from "fs";
import { join } from "path";

// GET /api/rent-roll/sample — serves the sanitized sample rent roll to authenticated users only
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const filePath = join(process.cwd(), "src", "app", "api", "rent-roll", "sample.xlsx");
    const fileBuffer = readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Rent_Roll_Sample.xlsx"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to serve sample" },
      { status: 500 }
    );
  }
}
