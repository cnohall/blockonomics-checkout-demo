const BASE_URL = process.env.BLOCKONOMICS_API_URL;
const API_KEY = process.env.BLOCKONOMICS_API_KEY;
const MATCH_CALLBACK = process.env.BLOCKONOMICS_MATCH_CALLBACK;

if (!BASE_URL || !API_KEY || !MATCH_CALLBACK) {
  throw new Error("Missing BLOCKONOMICS_API_URL, BLOCKONOMICS_API_KEY, or BLOCKONOMICS_MATCH_CALLBACK env vars");
}

export async function createPaymentIntent(
  amount: number,
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
