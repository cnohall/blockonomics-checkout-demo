import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const data = Object.fromEntries(searchParams.entries());
  console.log("[blockonomics callback GET]", JSON.stringify(data));
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  console.log("[blockonomics callback]", JSON.stringify(body));
  // TODO: verify signature, update order state, notify client via SSE/WS
  return NextResponse.json({ ok: true });
}
