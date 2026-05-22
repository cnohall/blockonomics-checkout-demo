import { NextRequest, NextResponse } from "next/server";
import { createPaymentQuote } from "@/app/lib/api";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { crypto } = await req.json();
    const quote = await createPaymentQuote(params.id, crypto);
    return NextResponse.json(quote);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
