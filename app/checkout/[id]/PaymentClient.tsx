"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PaymentIntent, PaymentQuote } from "@/app/lib/types";

function formatCrypto(quote: PaymentQuote): string {
  if (quote.crypto === "BTC") {
    return `${(quote.amount / 100_000_000).toFixed(8)} BTC`;
  }
  return `${(quote.amount / 1_000_000).toFixed(2)} USDT`;
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function StatusBadge({ status }: { status: PaymentIntent["status"] }) {
  const styles: Record<PaymentIntent["status"], string> = {
    unpaid: "bg-yellow-900 text-yellow-300 border-yellow-700",
    processing: "bg-blue-900 text-blue-300 border-blue-700",
    paid: "bg-green-900 text-green-300 border-green-700",
    underpaid: "bg-red-900 text-red-300 border-red-700",
  };
  const labels: Record<PaymentIntent["status"], string> = {
    unpaid: "Awaiting payment",
    processing: "Processing",
    paid: "Paid",
    underpaid: "Underpaid",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${styles[status]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}

function Countdown({
  seconds,
  onExpire,
}: {
  seconds: number;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState(seconds);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    setRemaining(seconds);
  }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) {
      expireRef.current();
      return;
    }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isLow = remaining < 60;

  return (
    <span className={`font-mono font-bold text-lg ${isLow ? "text-red-400" : "text-white"}`}>
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

export default function PaymentClient({
  initialIntent,
}: {
  initialIntent: PaymentIntent;
}) {
  const [intent, setIntent] = useState<PaymentIntent>(initialIntent);
  const initialQuote = initialIntent.payment_quotes?.[0] ?? null;
  const [quote, setQuote] = useState<PaymentQuote | null>(initialQuote);
  const [selectedCrypto, setSelectedCrypto] = useState<"BTC" | "USDT">("BTC");
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
  // if page was refreshed mid-session the seeded quote has no expires_in — treat as expired
  const [expired, setExpired] = useState(initialQuote !== null && initialQuote.expires_in === undefined);
  const [copied, setCopied] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const quoteRef = useRef(quote);
  quoteRef.current = quote;

  const pollIntent = useCallback(async () => {
    try {
      const res = await fetch(`/api/payment-intents/${intent.id}`);
      if (!res.ok) return;
      const data: PaymentIntent = await res.json();
      setIntent(data);
      // sync txid/status/paid_amount into active quote from poll
      const active = quoteRef.current;
      if (active && data.payment_quotes) {
        const updated = data.payment_quotes.find((q) => q.id === active.id);
        if (updated) {
          setQuote((prev) =>
            prev
              ? { ...prev, txid: updated.txid, status: updated.status, paid_amount: updated.paid_amount }
              : prev
          );
        }
      }
    } catch {
      // silently ignore poll errors
    }
  }, [intent.id]);

  useEffect(() => {
    if (intent.status === "paid") return;
    const interval = setInterval(pollIntent, 5000);
    return () => clearInterval(interval);
  }, [intent.status, pollIntent]);

  async function requestQuote(crypto: "BTC" | "USDT") {
    setLoadingQuote(true);
    setQuoteError(null);
    setExpired(false);
    try {
      const res = await fetch(`/api/payment-intents/${intent.id}/quotes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ crypto }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get quote");
      setQuote(data);
    } catch (e) {
      setQuoteError(String(e));
    } finally {
      setLoadingQuote(false);
    }
  }

  async function handleRefresh() {
    if (!quote) return;
    setLoadingRefresh(true);
    setExpired(false);
    try {
      const res = await fetch(
        `/api/payment-intents/${intent.id}/quotes/${quote.id}/refresh`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to refresh quote");
      setQuote(data);
    } catch (e) {
      setQuoteError(String(e));
    } finally {
      setLoadingRefresh(false);
    }
  }

  async function handleCryptoChange(crypto: "BTC" | "USDT") {
    setSelectedCrypto(crypto);
    await requestQuote(crypto);
  }

  async function copyAddress() {
    if (!quote?.address) return;
    try {
      await navigator.clipboard.writeText(quote.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable (insecure origin)
    }
  }

  const cryptos = intent.store_settings?.active_cryptos ?? ["BTC", "USDT"];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-gray-400 text-sm">Payment</p>
            <p className="text-2xl font-bold text-white">{formatUsd(intent.amount)}</p>
          </div>
          <StatusBadge status={intent.status} />
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          {/* Crypto selector */}
          <div className="flex border-b border-gray-800">
            {(["BTC", "USDT"] as const)
              .filter((c) => cryptos.includes(c))
              .map((c) => (
                <button
                  key={c}
                  onClick={() => handleCryptoChange(c)}
                  disabled={loadingQuote}
                  className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
                    selectedCrypto === c
                      ? "bg-gray-800 text-orange-400 border-b-2 border-orange-500"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {c === "BTC" ? "₿ Bitcoin" : "₮ Tether"}
                </button>
              ))}
          </div>

          <div className="p-6 space-y-5">
            {!quote && !loadingQuote && (
              <button
                onClick={() => requestQuote(selectedCrypto)}
                className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Get Payment Address
              </button>
            )}

            {loadingQuote && (
              <div className="flex items-center justify-center py-6 text-gray-400 gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating address…
              </div>
            )}

            {quoteError && (
              <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
                {quoteError}
              </div>
            )}

            {quote && !loadingQuote && (
              <>
                {/* Amount */}
                <div className="bg-gray-800 rounded-xl px-5 py-4 text-center">
                  <p className="text-gray-400 text-xs mb-1">Send exactly</p>
                  <p className="text-2xl font-bold text-white">{formatCrypto(quote)}</p>
                  {intent.status === "underpaid" && (
                    <p className="text-red-400 text-xs mt-1">
                      Received {formatCrypto({ ...quote, amount: quote.paid_amount })} — underpaid
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <p className="text-gray-400 text-xs mb-2">Address</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-gray-800 rounded-lg px-3 py-2.5 text-xs text-gray-300 break-all font-mono">
                      {quote.address}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="flex-shrink-0 p-2.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors"
                      title="Copy address"
                    >
                      {copied ? (
                        <svg className="w-4 h-4 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Timer */}
                {quote.expires_in !== undefined && !expired && (
                  <div className="flex items-center justify-between bg-gray-800 rounded-lg px-4 py-3">
                    <span className="text-gray-400 text-sm">Quote expires in</span>
                    <Countdown
                      seconds={quote.expires_in}
                      onExpire={() => setExpired(true)}
                    />
                  </div>
                )}

                {expired && (
                  <div className="flex items-center justify-between bg-red-950 border border-red-800 rounded-lg px-4 py-3">
                    <span className="text-red-400 text-sm">Quote expired — refresh for new rate</span>
                    <button
                      onClick={handleRefresh}
                      disabled={loadingRefresh}
                      className="text-orange-400 hover:text-orange-300 text-sm font-semibold disabled:opacity-50 transition-colors"
                    >
                      {loadingRefresh ? "Refreshing…" : "Refresh"}
                    </button>
                  </div>
                )}

                {/* TXID on processing */}
                {intent.status === "processing" && quote?.txid && (
                  <div>
                    <p className="text-gray-400 text-xs mb-1">Transaction ID</p>
                    <code className="block bg-gray-800 rounded-lg px-3 py-2 text-xs text-gray-300 font-mono break-all">
                      {quote.txid}
                    </code>
                  </div>
                )}

                {/* Paid state */}
                {intent.status === "paid" && (
                  <div className="flex items-center gap-3 bg-green-950 border border-green-800 rounded-xl px-5 py-4">
                    <svg className="w-6 h-6 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <p className="text-green-300 font-semibold">Payment confirmed</p>
                      <p className="text-green-500 text-xs">{formatUsd(intent.paid_amount)} received</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer meta */}
        <div className="mt-4 flex items-center justify-between text-xs text-gray-600">
          <span>Intent ID: <code className="font-mono">{intent.id}</code></span>
          {initialIntent.store_settings?.testmode && (
            <span className="bg-yellow-900 text-yellow-500 border border-yellow-700 px-2 py-0.5 rounded-full">
              Testmode
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
