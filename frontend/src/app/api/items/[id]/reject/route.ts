import { NextRequest, NextResponse } from "next/server";
import { rejectDemoItem } from "@/lib/demo_store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = rejectDemoItem(id);
  if (!success) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  return NextResponse.json({ status: "rejected", id });
}
