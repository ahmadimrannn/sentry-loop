import { NextRequest, NextResponse } from "next/server";

const BACKEND_BASE = (process.env.WEBHOOK_BASE_URL ?? "").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate that service is one of the two known values before forwarding.
    if (!["lumen", "cognilead"].includes(body?.service)) {
      return NextResponse.json(
        { error: "service must be 'lumen' or 'cognilead'" },
        { status: 400 }
      );
    }

    const upstream = await fetch(`${BACKEND_BASE}/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ incident: body.incident, service: body.service }),
    });

    const data = await upstream.json().catch(() => ({}));

    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: "Failed to reach investigation backend." },
      { status: 502 }
    );
  }
}
