import { NextRequest, NextResponse } from "next/server";
import { createPaymentIntent, getPaymentIntents } from "@/app/lib/api";

export async function GET() {
  try {
    const intents = await getPaymentIntents();
    return NextResponse.json(intents);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { amount, currency } = await req.json();
    const intent = await createPaymentIntent(amount, currency);
    return NextResponse.json(intent);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
