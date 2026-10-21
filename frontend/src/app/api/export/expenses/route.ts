import { NextRequest, NextResponse } from "next/server";
import { generateExpenseCsv } from "@/lib/demo_store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const onlyApproved = searchParams.get("only_approved") !== "false";
  const csvData = generateExpenseCsv(onlyApproved);

  return new NextResponse(csvData, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="someday_expenses.csv"',
    },
  });
}
