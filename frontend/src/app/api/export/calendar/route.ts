import { NextRequest, NextResponse } from "next/server";
import { generateCalendarIcs } from "@/lib/demo_store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const onlyApproved = searchParams.get("only_approved") !== "false";
  const icsData = generateCalendarIcs(onlyApproved);

  return new NextResponse(icsData, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="someday_events.ics"',
    },
  });
}
