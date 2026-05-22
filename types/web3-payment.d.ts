declare namespace JSX {
  interface IntrinsicElements {
    "web3-payment": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        order_amount?: string;
        receive_address?: string;
        testnet?: string;
      },
      HTMLElement
    >;
  }
}
