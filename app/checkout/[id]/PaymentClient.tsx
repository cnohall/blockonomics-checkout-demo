"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PaymentIntent, PaymentQuote } from "@/app/lib/types";
import UsdtPayButton from "@/app/components/UsdtPayButton";

function formatCrypto(quote: PaymentQuote): string {
  if (quote.crypto === "BTC") return `${(quote.amount / 100_000_000).toFixed(8)} BTC`;
  return `${(quote.amount / 1_000_000).toFixed(2)} USDT`;
}

function formatUsd(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function StatusBadge({ status }: { status: PaymentIntent["status"] }) {
  const styles: Record<PaymentIntent["status"], { bg: string; text: string; border: string }> = {
    unpaid:     { bg: "var(--warn-bg)",  text: "var(--warn-text)",  border: "var(--warn-border)"  },
    processing: { bg: "var(--info-bg)",  text: "var(--info-text)",  border: "var(--info-border)"  },
    paid:       { bg: "var(--ok-bg)",    text: "var(--ok-text)",    border: "var(--ok-border)"    },
    underpaid:  { bg: "var(--err-bg)",   text: "var(--err-text)",   border: "var(--err-border)"   },
  };
  const labels: Record<PaymentIntent["status"], string> = {
    unpaid:     "Awaiting payment",
    processing: "Confirming",
    paid:       "Paid",
    underpaid:  "Underpaid",
  };
  const s = styles[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "currentColor" }} />
      {labels[status]}
    </span>
  );
}

function Countdown({ seconds, onExpire }: { seconds: number; onExpire: () => void }) {
  const [remaining, setRemaining] = useState(seconds);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => { setRemaining(seconds); }, [seconds]);

  useEffect(() => {
    if (remaining <= 0) { expireRef.current(); return; }
    const t = setTimeout(() => setRemaining((r) => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isLow = remaining < 60;

  return (
    <span
      className="font-mono font-bold"
      style={{ color: isLow ? "var(--err-text)" : "var(--text-1)" }}
    >
      {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </span>
  );
}

export default function PaymentClient({
  initialIntent,
  testmode,
}: {
  initialIntent: PaymentIntent;
  testmode: boolean;
}) {
  const [intent, setIntent] = useState<PaymentIntent>(initialIntent);
  const initialQuote = initialIntent.payment_quotes?.[0] ?? null;
  const [quote, setQuote] = useState<PaymentQuote | null>(initialQuote);
  const [selectedCrypto, setSelectedCrypto] = useState<"BTC" | "USDT">("BTC");
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingRefresh, setLoadingRefresh] = useState(false);
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
      const active = quoteRef.current;
      if (active && data.payment_quotes) {
        const updated = data.payment_quotes.find((q) => q.id === active.id);
        if (updated) {
          setQuote((prev) =>
            prev ? { ...prev, txid: updated.txid, status: updated.status, paid_amount: updated.paid_amount } : prev
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
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <a href="/" className="link-muted">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <div className="flex-1">
            <p className="text-xs" style={{ color: "var(--text-3)" }}>Daily Grind · Order #4821</p>
            <p className="font-semibold" style={{ color: "var(--text-1)" }}>{formatUsd(intent.amount)}</p>
          </div>
          <StatusBadge status={intent.status} />
        </div>

        <div
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--surface)",
            boxShadow: "0 1px 3px oklch(22% 0.018 55 / 0.07), 0 6px 24px oklch(22% 0.018 55 / 0.05)",
          }}
        >
          {/* Crypto tabs */}
          <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
            {(["BTC", "USDT"] as const)
              .filter((c) => cryptos.includes(c))
              .map((c) => (
                <button
                  key={c}
                  onClick={() => handleCryptoChange(c)}
                  disabled={loadingQuote}
                  className={`flex-1 py-3 text-sm font-medium transition-colors ${
                    selectedCrypto === c ? "tab-active" : "tab-inactive"
                  }`}
                >
                  {c === "BTC" ? "Bitcoin" : "Tether USDT"}
                </button>
              ))}
          </div>

          <div className="p-5 space-y-4">

            {!quote && !loadingQuote && (
              <button
                onClick={() => requestQuote(selectedCrypto)}
                className="btn-accent w-full font-semibold py-3 rounded-xl text-sm"
              >
                Get payment address
              </button>
            )}

            {loadingQuote && (
              <div
                className="flex items-center justify-center py-8 gap-2 text-sm"
                style={{ color: "var(--text-3)" }}
              >
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generating address…
              </div>
            )}

            {quoteError && (
              <div
                className="rounded-lg px-3 py-2.5 text-xs font-mono break-all"
                style={{
                  backgroundColor: "var(--err-bg)",
                  border: "1px solid var(--err-border)",
                  color: "var(--err-text)",
                }}
              >
                {quoteError}
              </div>
            )}

            {quote && !loadingQuote && (
              <>
                {/* Amount box */}
                <div
                  className="rounded-xl px-4 py-4 text-center"
                  style={{ backgroundColor: "var(--surface-2)" }}
                >
                  <p className="text-xs mb-1 uppercase tracking-wide" style={{ color: "var(--text-3)" }}>
                    Send exactly
                  </p>
                  <p
                    className="text-2xl font-bold tracking-tight"
                    style={{ fontFamily: "'Bodoni Moda', Georgia, serif", color: "var(--text-1)" }}
                  >
                    {formatCrypto(quote)}
                  </p>
                  {intent.status === "underpaid" && (
                    <p className="text-xs mt-1.5" style={{ color: "var(--err-text)" }}>
                      Received {formatCrypto({ ...quote, amount: quote.paid_amount })} — amount short
                    </p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: "var(--text-3)" }}>
                    Address
                  </p>
                  <div className="flex items-center gap-2">
                    <code
                      className="flex-1 rounded-lg px-3 py-2 text-xs break-all font-mono leading-relaxed"
                      style={{
                        backgroundColor: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--text-2)",
                      }}
                    >
                      {quote.address}
                    </code>
                    <button
                      onClick={copyAddress}
                      className="flex-shrink-0 p-2.5 rounded-lg transition-colors"
                      style={{
                        backgroundColor: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--text-3)",
                      }}
                      title="Copy address"
                    >
                      {copied ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--ok-text)" }}>
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

                {/* USDT web3 pay button */}
                {selectedCrypto === "USDT" && intent.status !== "paid" && (
                  <UsdtPayButton
                    address={quote.address}
                    amount={quote.amount}
                    testmode={testmode}
                  />
                )}

                {/* Timer */}
                {quote.expires_in !== undefined && !expired && (
                  <div
                    className="flex items-center justify-between rounded-lg px-4 py-2.5"
                    style={{ backgroundColor: "var(--surface-2)" }}
                  >
                    <span className="text-sm" style={{ color: "var(--text-3)" }}>Rate expires</span>
                    <Countdown seconds={quote.expires_in} onExpire={() => setExpired(true)} />
                  </div>
                )}

                {expired && (
                  <div
                    className="flex items-center justify-between rounded-lg px-4 py-2.5"
                    style={{
                      backgroundColor: "var(--err-bg)",
                      border: "1px solid var(--err-border)",
                    }}
                  >
                    <span className="text-sm" style={{ color: "var(--err-text)" }}>Rate expired</span>
                    <button
                      onClick={handleRefresh}
                      disabled={loadingRefresh}
                      className="text-sm font-semibold disabled:opacity-50 transition-colors"
                      style={{ color: "var(--accent)" }}
                    >
                      {loadingRefresh ? "Refreshing…" : "Refresh rate"}
                    </button>
                  </div>
                )}

                {/* TXID */}
                {intent.status === "processing" && quote?.txid && (
                  <div>
                    <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: "var(--text-3)" }}>
                      Transaction
                    </p>
                    <code
                      className="block rounded-lg px-3 py-2 text-xs font-mono break-all"
                      style={{
                        backgroundColor: "var(--surface-2)",
                        border: "1px solid var(--border)",
                        color: "var(--text-2)",
                      }}
                    >
                      {quote.txid}
                    </code>
                  </div>
                )}

                {/* Paid */}
                {intent.status === "paid" && (
                  <div
                    className="flex items-center gap-3 rounded-xl px-4 py-4"
                    style={{
                      backgroundColor: "var(--ok-bg)",
                      border: "1px solid var(--ok-border)",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "var(--ok-border)" }}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--ok-text)" }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: "var(--ok-text)" }}>
                        Payment confirmed
                      </p>
                      <p className="text-xs" style={{ color: "var(--ok-text)", opacity: 0.65 }}>
                        {formatUsd(intent.paid_amount)} received · Thank you!
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between text-xs" style={{ color: "var(--text-3)" }}>
          <span className="font-mono">{intent.id}</span>
          {initialIntent.store_settings?.testmode && (
            <span
              className="px-2 py-0.5 rounded-full"
              style={{ color: "var(--warn-text)", border: "1px solid var(--warn-border)" }}
            >
              testmode
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
