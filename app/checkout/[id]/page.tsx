import { getPaymentIntent } from "@/app/lib/api";
import PaymentClient from "./PaymentClient";
import { notFound } from "next/navigation";

interface Props {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: Props) {
  let intent;
  try {
    intent = await getPaymentIntent(params.id);
  } catch {
    notFound();
  }

  return <PaymentClient initialIntent={intent} />;
}
