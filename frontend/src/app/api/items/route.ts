import { NextRequest, NextResponse } from "next/server";
import { getDemoItems } from "@/lib/demo_store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || undefined;
  const approval_status = searchParams.get("approval_status") || undefined;
  const validation_status = searchParams.get("validation_status") || undefined;
  const search = searchParams.get("search") || undefined;

  const result = getDemoItems({
    category,
    approval_status,
    validation_status,
    search,
  });

  return NextResponse.json(result);
}
