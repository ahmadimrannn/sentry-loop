import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = (process.env.WEBHOOK_BASE_URL ?? "").replace(/\/$/, "");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ thread_id: string }> }
) {
  const { thread_id } = await params;

  try {
    const upstream = await fetch(
      `${BACKEND_BASE}/investigate/status/${thread_id}`,
      { cache: "no-store" }
    );

    const data = await upstream.json().catch(() => ({}));

    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach investigation backend." },
      { status: 502 }
    );
  }
}
