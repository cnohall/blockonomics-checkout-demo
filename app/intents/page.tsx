import Link from "next/link";
import { getPaymentIntents, PaymentIntent } from "@/app/lib/api";

export const dynamic = "force-dynamic";

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  const vars =
    s === "completed" || s === "paid" || s === "confirmed"
      ? { bg: "var(--ok-bg)", text: "var(--ok-text)", border: "var(--ok-border)" }
      : s === "expired" || s === "failed"
      ? { bg: "var(--err-bg)", text: "var(--err-text)", border: "var(--err-border)" }
      : s === "pending" || s === "unpaid" || s === "underpaid"
      ? { bg: "var(--warn-bg)", text: "var(--warn-text)", border: "var(--warn-border)" }
      : { bg: "var(--info-bg)", text: "var(--info-text)", border: "var(--info-border)" };

  return (
    <span
      className="inline-block text-xs font-medium px-2 py-0.5 rounded-full"
      style={{ backgroundColor: vars.bg, color: vars.text, border: `1px solid ${vars.border}` }}
    >
      {status}
    </span>
  );
}

function fmt(cents: number, currency: string) {
  try {
    return (cents / 100).toLocaleString("en-US", { style: "currency", currency });
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

export default async function IntentsPage() {
  let intents: PaymentIntent[] = [];
  let fetchError: string | null = null;

  try {
    intents = await getPaymentIntents();
  } catch (e) {
    fetchError = String(e);
  }

  return (
    <main
      className="min-h-screen px-4 py-10"
      style={{ backgroundColor: "var(--bg)" }}
    >
      <div className="max-w-3xl mx-auto">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1
              className="text-xl font-semibold tracking-tight"
              style={{ fontFamily: "'Bodoni Moda', Georgia, serif", color: "var(--text-1)" }}
            >
              Payment Intents
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
              Debug &amp; testing — all intents from Blockonomics
            </p>
          </div>
          <Link
            href="/"
            className="text-xs px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--text-2)",
            }}
          >
            ← Checkout
          </Link>
        </div>

        {fetchError && (
          <div
            className="rounded-lg px-4 py-3 text-sm font-mono mb-6"
            style={{
              backgroundColor: "var(--err-bg)",
              border: "1px solid var(--err-border)",
              color: "var(--err-text)",
            }}
          >
            {fetchError}
          </div>
        )}

        {!fetchError && intents.length === 0 && (
          <div
            className="rounded-2xl p-8 text-center text-sm"
            style={{
              backgroundColor: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--text-3)",
            }}
          >
            No payment intents found.
          </div>
        )}

        {intents.length > 0 && (
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              backgroundColor: "var(--surface)",
              boxShadow: "0 1px 3px oklch(22% 0.018 55 / 0.07), 0 6px 24px oklch(22% 0.018 55 / 0.05)",
            }}
          >
            <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["ID", "Amount", "Status", ""].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                      style={{ color: "var(--text-3)" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {intents.map((intent: PaymentIntent, i: number) => (
                  <tr
                    key={intent.id}
                    style={{
                      borderBottom: i < intents.length - 1 ? "1px solid var(--border)" : undefined,
                    }}
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      <Link
                        href={`/intents/${intent.id}`}
                        style={{ color: "var(--accent)" }}
                      >
                        {intent.id}
                      </Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--text-1)" }}>
                      {fmt(intent.amount, intent.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={intent.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/intents/${intent.id}`}
                          className="text-xs px-2.5 py-1 rounded-md"
                          style={{
                            backgroundColor: "var(--surface-2)",
                            border: "1px solid var(--border)",
                            color: "var(--text-2)",
                          }}
                        >
                          Details
                        </Link>
                        <Link
                          href={`/checkout/${intent.id}`}
                          className="text-xs px-2.5 py-1 rounded-md btn-accent"
                        >
                          Open
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
