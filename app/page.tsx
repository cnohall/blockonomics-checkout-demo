"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ITEMS = [
  { name: "Ethiopia Yirgacheffe", qty: 1, price: 1800 },
  { name: "Oat Milk Latte", qty: 2, price: 650 },
];

export default function Home() {
  const router = useRouter();
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      router.push(`/checkout/${data.id}`);
    } catch (e) {
      setError(String(e));
      setLoading(false);
    }
  }

  function fmt(cents: number) {
    return (cents / 100).toLocaleString("en-US", { style: "currency", currency });
  }

  return (
    <main className="min-h-screen bg-stone-950 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-800 mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-amber-200" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 2h12l1 4H5L6 2zM5 6h14v2a7 7 0 01-14 0V6zM8 14c0 2.21 1.79 4 4 4s4-1.79 4-4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 10c1.1 0 2 .9 2 2s-.9 2-2 2" />
            </svg>
          </div>
          <h1 className="text-stone-100 text-xl font-semibold tracking-tight">Daily Grind</h1>
          <p className="text-stone-500 text-xs mt-0.5">Specialty coffee · Order #4821</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">

          {/* Order lines */}
          <div className="p-5 space-y-3 border-b border-stone-800">
            {ITEMS.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div>
                  <p className="text-stone-200 text-sm font-medium">{item.name}</p>
                  <p className="text-stone-500 text-xs">Qty {item.qty}</p>
                </div>
                <p className="text-stone-300 text-sm">{fmt(item.price * item.qty)}</p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="px-5 py-4 space-y-1.5 border-b border-stone-800">
            <div className="flex justify-between text-sm text-stone-400">
              <span>Subtotal</span><span>{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-stone-400">
              <span>Tax (8%)</span><span>{fmt(tax)}</span>
            </div>
            <div className="flex justify-between text-base font-semibold text-stone-100 pt-1">
              <span>Total</span><span>{fmt(total)}</span>
            </div>
          </div>

          {/* Currency + pay */}
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wide">
                Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-stone-200 text-sm focus:outline-none focus:border-amber-600 transition-colors"
              >
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
              </select>
            </div>

            {error && (
              <div className="bg-red-950 border border-red-900 rounded-lg px-3 py-2.5 text-red-400 text-xs font-mono break-all">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-700 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-amber-50 font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? "Opening checkout…" : "Pay with crypto"}
            </button>

            <p className="text-center text-stone-600 text-xs">
              Secured by Blockonomics · Bitcoin & USDT accepted
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}
