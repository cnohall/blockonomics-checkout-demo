import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Grind Coffee",
  description: "Specialty coffee · Crypto checkout",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Script
          src="https://blockonomics.co/js/web3-payment.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}
