import { NextResponse } from "next/server";
import { getDemoMetrics } from "@/lib/demo_store";

export async function GET() {
  return NextResponse.json(getDemoMetrics());
}
