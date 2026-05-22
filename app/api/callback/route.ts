import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  console.log("[blockonomics callback]", JSON.stringify(body));
  // TODO: verify signature, update order state, notify client via SSE/WS
  return NextResponse.json({ ok: true });
}
