import { NextRequest, NextResponse } from "next/server";
import { generateReadingExport } from "@/lib/demo_store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "csv";
  const onlyApproved = searchParams.get("only_approved") !== "false";
  const result = generateReadingExport(format, onlyApproved);

  if (format === "json") {
    return NextResponse.json(result);
  }

  return new NextResponse(result as string, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="someday_reading.csv"',
    },
  });
}
