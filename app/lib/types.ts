export interface PaymentIntent {
  id: string;
  status: "unpaid" | "processing" | "paid" | "underpaid";
  amount: number;       // USD cents
  currency: string;
  paid_amount: number;  // USD cents
  store_settings?: {
    active_cryptos: string[];
    testmode: boolean;
  };
  payment_quotes?: PaymentQuote[];
}

export interface PaymentQuote {
  id: string;
  payment_intent_id: string;
  amount: number;       // satoshis (BTC) or USDT base units
  paid_amount: number;
  crypto: "BTC" | "USDT";
  address: string;
  status: "pending" | "unconfirmed" | "partially_confirmed" | "confirmed";
  txid: string | null;
  paid_timestamp: number | null;
  expires_in?: number;  // seconds, only on create/refresh
}
