"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    Blockonomics?: {
      checkout: (opts: { msg_area: string; intent_id: string; timer?: number }) => void;
    };
  }
}

export default function PaymentClient({
  intentId,
  onClose,
}: {
  intentId: string;
  onClose?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.Blockonomics?.checkout({
      msg_area: "payment-container",
      intent_id: intentId,
      timer: 600,
    });
  }, [intentId]);

  // Widget screens dispatch a bubbling `close` event; the widget only hides
  // itself, so the host has to tear down its own wrapper.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !onClose) return;
    el.addEventListener("close", onClose);
    return () => el.removeEventListener("close", onClose);
  }, [onClose]);

  return <div id="payment-container" ref={containerRef} />;
}
