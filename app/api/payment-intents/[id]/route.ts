import { NextRequest, NextResponse } from "next/server";
import { getPaymentIntent } from "@/app/lib/api";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const intent = await getPaymentIntent(params.id);
    return NextResponse.json(intent);
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
