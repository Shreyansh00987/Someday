import { NextRequest, NextResponse } from "next/server";
import { approveDemoItem } from "@/lib/demo_store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = approveDemoItem(id);
  if (!success) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  return NextResponse.json({ status: "approved", id });
}
