import { NextRequest, NextResponse } from "next/server";
import { bulkApproveDemoItems } from "@/lib/demo_store";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const ids: string[] = body.item_ids || body.ids || [];
  const approved_count = bulkApproveDemoItems(ids);
  return NextResponse.json({ approved_count });
}
