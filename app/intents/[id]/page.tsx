import Link from "next/link";
import { getPaymentIntent, PaymentQuote } from "@/app/lib/api";

export const dynamic = "force-dynamic";

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wider mb-0.5" style={{ color: "var(--text-3)" }}>
        {label}
      </dt>
      <dd className="text-sm" style={{ color: "var(--text-1)" }}>
        {value}
      </dd>
    </div>
  );
}

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

function fmtDate(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

function fmtAmount(cents: number, currency: string) {
  try {
    return (cents / 100).toLocaleString("en-US", { style: "currency", currency });
  } catch {
    return `${currency} ${(cents / 100).toFixed(2)}`;
  }
}

function fmtCryptoAmount(amount: number, crypto: string) {
  if (crypto === "BTC") return `${(amount / 1e8).toFixed(8)} BTC`;
  if (crypto === "USDT") return `${(amount / 1e6).toFixed(6)} USDT`;
  return `${amount} ${crypto}`;
}

interface Props {
  params: { id: string };
}

export default async function IntentDetailPage({ params }: Props) {
  let intent = null;
  let fetchError: string | null = null;

  try {
    intent = await getPaymentIntent(params.id);
  } catch (e) {
    fetchError = String(e);
  }

  return (
    <main className="min-h-screen px-4 py-10" style={{ backgroundColor: "var(--bg)" }}>
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-semibold tracking-tight"
              style={{ fontFamily: "'Bodoni Moda', Georgia, serif", color: "var(--text-1)" }}
            >
              Intent Detail
            </h1>
            <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-3)" }}>
              {params.id}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {intent && (
              <Link
                href={`/checkout/${intent.id}`}
                className="text-xs px-3 py-1.5 rounded-lg btn-accent"
              >
                Open checkout
              </Link>
            )}
            <Link
              href="/intents"
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{
                backgroundColor: "var(--surface-2)",
                border: "1px solid var(--border)",
                color: "var(--text-2)",
              }}
            >
              ← All intents
            </Link>
          </div>
        </div>

        {/* Error */}
        {fetchError && (
          <div
            className="rounded-lg px-4 py-3 text-sm font-mono"
            style={{
              backgroundColor: "var(--err-bg)",
              border: "1px solid var(--err-border)",
              color: "var(--err-text)",
            }}
          >
            {fetchError}
          </div>
        )}

        {intent && (
          <>
            {/* Intent fields */}
            <div
              className="rounded-2xl p-5"
              style={{
                backgroundColor: "var(--surface)",
                boxShadow: "0 1px 3px oklch(22% 0.018 55 / 0.07), 0 6px 24px oklch(22% 0.018 55 / 0.05)",
              }}
            >
              <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "var(--text-3)" }}>
                Payment Intent
              </h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <Field label="Status" value={<StatusBadge status={intent.status} />} />
                <Field label="Amount" value={fmtAmount(intent.amount, intent.currency)} />
                <Field label="Paid" value={fmtAmount(intent.paid_amount, intent.currency)} />
                <Field label="Currency" value={intent.currency} />
                <Field label="Store ID" value={String(intent.store_id)} />
                <Field
                  label="Extra data"
                  value={
                    intent.extra_data != null
                      ? <span className="font-mono text-xs break-all">{intent.extra_data}</span>
                      : "—"
                  }
                />
              </dl>
            </div>

            {/* Quotes */}
            <div
              className="rounded-2xl overflow-hidden"
              style={{
                backgroundColor: "var(--surface)",
                boxShadow: "0 1px 3px oklch(22% 0.018 55 / 0.07), 0 6px 24px oklch(22% 0.018 55 / 0.05)",
              }}
            >
              <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-3)" }}>
                  Payment Quotes
                </h2>
              </div>

              {!intent.payment_quotes?.length ? (
                <p className="px-5 py-6 text-sm text-center" style={{ color: "var(--text-3)" }}>
                  No quotes yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border)" }}>
                        {["Crypto", "Amount", "Paid", "Address", "Status", "Txid", "Paid at", "Expires"].map((h) => (
                          <th
                            key={h}
                            className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider whitespace-nowrap"
                            style={{ color: "var(--text-3)" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {intent.payment_quotes.map((q: PaymentQuote, i: number) => (
                        <tr
                          key={q.id}
                          style={{
                            borderBottom:
                              i < (intent.payment_quotes?.length ?? 0) - 1
                                ? "1px solid var(--border)"
                                : undefined,
                          }}
                        >
                          <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: "var(--text-1)" }}>
                            {q.crypto}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: "var(--text-1)" }}>
                            {fmtCryptoAmount(q.amount, q.crypto)}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: "var(--text-2)" }}>
                            {fmtCryptoAmount(q.paid_amount, q.crypto)}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-2)", maxWidth: "140px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={q.address}>
                            {q.address}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <StatusBadge status={q.status} />
                          </td>
                          <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-2)", maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={q.txid ?? undefined}>
                            {q.txid ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-3)" }}>
                            {q.paid_timestamp != null
                              ? fmtDate(new Date(q.paid_timestamp * 1000).toISOString())
                              : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: "var(--text-3)" }}>
                            {fmtDate(new Date(q.expires_timestamp * 1000).toISOString())}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
