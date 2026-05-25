import PaymentClient from "./PaymentClient";

interface Props {
  params: { id: string };
}

export default function CheckoutPage({ params }: Props) {
  return <PaymentClient intentId={params.id} />;
}
