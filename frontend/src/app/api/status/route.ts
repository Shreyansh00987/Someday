import { NextResponse } from "next/server";
import { getDemoStatus } from "@/lib/demo_store";

export async function GET() {
  return NextResponse.json(getDemoStatus());
}
