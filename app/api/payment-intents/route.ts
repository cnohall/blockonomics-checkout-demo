import { NextRequest, NextResponse } from "next/server";
import { createPaymentIntent } from "@/app/lib/api";

export async function POST(req: NextRequest) {
  try {
    const { amount, currency } = await req.json();
    const intent = await createPaymentIntent(amount, currency);
    return NextResponse.json(intent);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
