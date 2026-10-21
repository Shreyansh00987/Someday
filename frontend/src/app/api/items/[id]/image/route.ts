import { NextRequest, NextResponse } from "next/server";
import { getItemById } from "@/lib/demo_store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const item = getItemById(id);
  const filename = item?.original_filename || "event_summit_poster.png";
  return NextResponse.redirect(new URL(`/samples/${filename}`, request.url));
}
