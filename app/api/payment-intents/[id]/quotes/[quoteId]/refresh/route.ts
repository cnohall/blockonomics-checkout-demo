import { NextRequest, NextResponse } from "next/server";
import { refreshPaymentQuote } from "@/app/lib/api";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string; quoteId: string } }
) {
  try {
    const quote = await refreshPaymentQuote(params.id, params.quoteId);
    return NextResponse.json(quote);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
