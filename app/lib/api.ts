const BASE_URL = process.env.BLOCKONOMICS_API_URL;
const API_KEY = process.env.BLOCKONOMICS_API_KEY;
const MATCH_CALLBACK = process.env.BLOCKONOMICS_MATCH_CALLBACK;

if (!BASE_URL || !API_KEY || !MATCH_CALLBACK) {
  throw new Error("Missing BLOCKONOMICS_API_URL, BLOCKONOMICS_API_KEY, or BLOCKONOMICS_MATCH_CALLBACK env vars");
}

export interface PaymentQuote {
  id: string;
  crypto: string;
  amount: string;
  // Base units as strings, so wei amounts keep precision
  crypto_amount: string;
  paid_crypto_amount: string;
  address: string;
  status: string;
  txid: string | null;
  paid_timestamp: number | null;
  expires_timestamp: number | null;
  [key: string]: unknown;
}

export interface PaymentIntent {
  id: string;
  store_id: number;
  amount: string;
  currency: string;
  status: string;
  due_amount: string;
  extra_data: string | null;
  created_at: number;
  payments?: PaymentQuote[];
  [key: string]: unknown;
}

export async function getPaymentIntents(): Promise<PaymentIntent[]> {
  const res = await fetch(`${BASE_URL}/api/v2/payment_intents`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`getPaymentIntents: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.data ?? [];
}

export async function getPaymentIntent(id: string): Promise<PaymentIntent> {
  const res = await fetch(`${BASE_URL}/api/v2/payment_intents/${id}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`getPaymentIntent: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.data ?? json;
}

export async function createPaymentIntent(
  amount: string,
  currency: string
): Promise<{ id: string }> {
  const res = await fetch(`${BASE_URL}/api/v2/payment_intents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
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
