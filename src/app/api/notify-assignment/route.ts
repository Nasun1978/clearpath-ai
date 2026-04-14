import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase";

interface NotifyPayload {
  email: string;
  full_name?: string;
  item_text: string;
  checklist_name: string;
  due_date?: string | null;
  assigned_by_name?: string;
}

// POST /api/notify-assignment
// Sends an email notification via Resend if RESEND_API_KEY is set.
// If not configured, logs to stdout and returns 200 — so the caller never blocks.
export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json() as NotifyPayload;

    if (!body.email?.trim() || !body.item_text?.trim()) {
      return NextResponse.json({ error: "email and item_text are required" }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;

    if (!resendKey) {
      // Graceful no-op when Resend is not configured
      console.log(`[notify-assignment] Would send to ${body.email}: "${body.item_text}" on ${body.checklist_name}`);
      return NextResponse.json({ sent: false, reason: "RESEND_API_KEY not configured" });
    }

    const dueLine = body.due_date
      ? `\n\nDue date: ${new Date(body.due_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`
      : "";

    const assignedByLine = body.assigned_by_name
      ? `\n\nAssigned by: ${body.assigned_by_name}`
      : "";

    const emailBody = {
      from:    "RipeSpot <notifications@ripespot.com>",
      to:      [body.email],
      subject: `Task assigned: ${body.item_text.slice(0, 60)}${body.item_text.length > 60 ? "…" : ""}`,
      text: `Hi ${body.full_name ?? "there"},

You have been assigned a checklist item on the ${body.checklist_name} project in RipeSpot.

Task: ${body.item_text}${dueLine}${assignedByLine}

Log in to RipeSpot to view the full checklist and update your progress.`,
      html: `<p>Hi ${body.full_name ?? "there"},</p>
<p>You have been assigned a checklist item on the <strong>${body.checklist_name}</strong> project in RipeSpot.</p>
<p><strong>Task:</strong> ${body.item_text}</p>${body.due_date ? `<p><strong>Due:</strong> ${new Date(body.due_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>` : ""}${body.assigned_by_name ? `<p><strong>Assigned by:</strong> ${body.assigned_by_name}</p>` : ""}
<p>Log in to RipeSpot to view the full checklist and update your progress.</p>`,
    };

    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${resendKey}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify(emailBody),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[notify-assignment] Resend error:", err);
      return NextResponse.json({ sent: false, reason: err }, { status: 500 });
    }

    const result = await res.json() as { id?: string };
    return NextResponse.json({ sent: true, resend_id: result.id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" }, { status: 500 });
  }
}
