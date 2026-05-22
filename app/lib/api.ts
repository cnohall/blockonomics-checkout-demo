import type { PaymentIntent, PaymentQuote } from "./types";

const BASE_URL = process.env.BLOCKONOMICS_API_URL;
const API_KEY = process.env.BLOCKONOMICS_API_KEY;
const MATCH_CALLBACK = process.env.BLOCKONOMICS_MATCH_CALLBACK;

if (!BASE_URL || !API_KEY || !MATCH_CALLBACK) {
  throw new Error("Missing BLOCKONOMICS_API_URL, BLOCKONOMICS_API_KEY, or BLOCKONOMICS_MATCH_CALLBACK env vars");
}

function headers() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  };
}

export async function createPaymentIntent(
  amount: number,
  currency: string
): Promise<PaymentIntent> {
  const res = await fetch(`${BASE_URL}/api/v2/payment_intents`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      amount,
      currency,
      match_callback: MATCH_CALLBACK,
      include_store_settings: true,
    }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`createPaymentIntent: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.data ?? json;
}

export async function createPaymentQuote(
  intentId: string,
  crypto: "BTC" | "USDT"
): Promise<PaymentQuote> {
  const res = await fetch(
    `${BASE_URL}/api/v2/payment_intents/${intentId}/payment_quotes`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ crypto }),
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(`createPaymentQuote: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.data ?? json;
}

export async function getPaymentIntent(intentId: string): Promise<PaymentIntent> {
  const res = await fetch(
    `${BASE_URL}/api/v2/payment_intents/${intentId}`,
    {
      headers: headers(),
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(`getPaymentIntent: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.data ?? json;
}

export async function refreshPaymentQuote(
  intentId: string,
  quoteId: string
): Promise<PaymentQuote> {
  const res = await fetch(
    `${BASE_URL}/api/v2/payment_intents/${intentId}/payment_quotes/${quoteId}/refresh`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}` },
      cache: "no-store",
    }
  );
  if (!res.ok) throw new Error(`refreshPaymentQuote: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.data ?? json;
}
