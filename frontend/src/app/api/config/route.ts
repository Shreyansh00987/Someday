import { NextRequest, NextResponse } from "next/server";

const config = {
  watch_folder: "sample_screenshots",
  recursive: false,
  idle_only: true,
  is_paused: false,
  active_model: "moondream",
  available_models: ["moondream", "gemma3:1b", "minicpm-v", "llava"],
  polling_interval_sec: 2.0,
  auto_approve_high_confidence: false,
};

export async function GET() {
  return NextResponse.json(config);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  Object.assign(config, body);
  return NextResponse.json(config);
}
