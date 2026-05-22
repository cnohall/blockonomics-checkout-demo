"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  address: string;
  amount: number;   // base units (6 decimals)
  testmode: boolean;
}

export default function UsdtPayButton({ address, amount, testmode }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [txhash, setTxhash] = useState<string | null>(null);

  const orderAmount = (amount / 1_000_000).toFixed(6);
  const explorerBase = testmode
    ? "https://sepolia.etherscan.io/tx"
    : "https://etherscan.io/tx";

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    (el as any).onTxnSubmitted = (result: { txhash: string; crypto: string }) => {
      setTxhash(result.txhash);
    };
  }, []);

  if (txhash) {
    return (
      <div className="space-y-3">
        <div
          className="flex items-center gap-2 rounded-lg px-4 py-3"
          style={{
            backgroundColor: "var(--info-bg)",
            border: "1px solid var(--info-border)",
          }}
        >
          <svg
            className="animate-spin w-4 h-4 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            style={{ color: "var(--info-text)" }}
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          <span className="text-sm" style={{ color: "var(--info-text)" }}>
            Waiting for confirmation…
          </span>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide mb-1.5" style={{ color: "var(--text-3)" }}>
            Transaction
          </p>
          <a
            href={`${explorerBase}/${txhash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg px-3 py-2 text-xs font-mono break-all transition-colors"
            style={{
              backgroundColor: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--accent)",
            }}
          >
            {txhash.slice(0, 10)}…{txhash.slice(-8)}
          </a>
        </div>
      </div>
    );
  }

  return (
    <web3-payment
      ref={ref}
      order_amount={orderAmount}
      receive_address={address}
      testnet={testmode ? "1" : "0"}
    />
  );
}
