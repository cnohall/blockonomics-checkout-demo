"use client";

import { useState } from "react";
import Link from "next/link";
import PaymentClient from "./checkout/[id]/PaymentClient";

const ITEMS = [
  { name: "Ethiopia Yirgacheffe", qty: 1, price: 1800 },
  { name: "Oat Milk Latte", qty: 2, price: 650 },
];

export default function Home() {
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intentId, setIntentId] = useState<string | null>(null);

  const subtotal = ITEMS.reduce((s, i) => s + i.price * i.qty, 0);
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + tax;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/payment-intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, currency }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create payment intent");
      setIntentId(data.id);
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  function fmt(cents: number) {
    return (cents / 100).toLocaleString("en-US", { style: "currency", currency });
  }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-11 h-11 rounded-full mb-3"
            style={{ backgroundColor: "var(--surface-2)" }}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="w-5 h-5"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ color: "var(--accent)" }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 2h12l1 4H5L6 2zM5 6h14v2a7 7 0 01-14 0V6zM8 14c0 2.21 1.79 4 4 4s4-1.79 4-4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 10c1.1 0 2 .9 2 2s-.9 2-2 2" />
            </svg>
          </div>
          <h1
            className="text-xl font-semibold tracking-tight"
            style={{ fontFamily: "'Bodoni Moda', Georgia, serif", color: "var(--text-1)" }}
          >
            Daily Grind
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            Specialty coffee · Order #4821
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl overflow-hidden"
          style={{
            backgroundColor: "var(--surface)",
            boxShadow: "0 1px 3px oklch(22% 0.018 55 / 0.07), 0 6px 24px oklch(22% 0.018 55 / 0.05)",
          }}
        >
          {/* Order lines */}
          <div className="p-5 space-y-3" style={{ borderBottom: "1px solid var(--border)" }}>
            {ITEMS.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-1)" }}>
                    {item.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-3)" }}>
                    Qty {item.qty}
                  </p>
                </div>
                <p className="text-sm" style={{ color: "var(--text-2)" }}>
                  {fmt(item.price * item.qty)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="px-5 py-4 space-y-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="flex justify-between text-sm" style={{ color: "var(--text-3)" }}>
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: "var(--text-3)" }}>
              <span>Tax (8%)</span><span>{fmt(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold pt-1" style={{ color: "var(--text-1)" }}>
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>

          {/* Currency + pay */}
          {!intentId && (
            <div className="p-5 space-y-4">
              <div>
                <label
                  className="block text-xs font-medium mb-1.5 uppercase tracking-wider"
                  style={{ color: "var(--text-3)" }}
                >
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
                  style={{
                    backgroundColor: "var(--surface-2)",
                    border: "1px solid var(--border)",
                    color: "var(--text-1)",
                  }}
                >
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                  <option value="GBP">GBP — British Pound</option>
                </select>
              </div>

              {error && (
                <div
                  className="rounded-lg px-3 py-2.5 text-xs font-mono break-all"
                  style={{
                    backgroundColor: "var(--err-bg)",
                    border: "1px solid var(--err-border)",
                    color: "var(--err-text)",
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-accent w-full font-semibold py-3 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Opening checkout…" : "Pay with crypto"}
              </button>

              <p className="text-center text-xs" style={{ color: "var(--text-3)" }}>
                Secured by Blockonomics · Bitcoin & USDT accepted
              </p>
            </div>
          )}
        </form>

        <div className="mt-4 text-center">
          <Link href="/intents" className="text-xs link-muted">
            View payment history →
          </Link>
        </div>

        {intentId && (
          <div
            className="rounded-2xl mt-4 p-5"
            style={{
              backgroundColor: "var(--surface)",
              boxShadow: "0 1px 3px oklch(22% 0.018 55 / 0.07), 0 6px 24px oklch(22% 0.018 55 / 0.05)",
            }}
          >
            <PaymentClient intentId={intentId} />
          </div>
        )}
      </div>
    </main>
  );
}
