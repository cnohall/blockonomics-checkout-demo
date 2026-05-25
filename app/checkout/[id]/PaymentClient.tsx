"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    Blockonomics?: {
      checkout: (opts: { msg_area: string; intent_id: string; timer?: number }) => void;
    };
  }
}

export default function PaymentClient({ intentId }: { intentId: string }) {
  useEffect(() => {
    window.Blockonomics?.checkout({
      msg_area: "payment-container",
      intent_id: intentId,
      timer: 600,
    });
  }, [intentId]);

  return <div id="payment-container" />;
}
