import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ triggered: 8, new_items: 0 });
}
