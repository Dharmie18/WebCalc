import type { Metadata } from "next";
import "./globals.css";
import VisualEditsMessenger from "../visual-edits/VisualEditsMessenger";
import ErrorReporter from "@/components/ErrorReporter";
import Script from "next/script";
import { Web3Provider } from "@/components/providers/Web3Provider";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "PocketBroker - Non-Custodial Crypto Trading Platform",
  description: "Trade crypto securely with the best rates across DEX aggregators",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">

        <Script
          src="https://slelguoygbfzlpylpxfs.supabase.co/storage/v1/object/public/scripts//route-messenger.js"
          strategy="afterInteractive"
          data-target-origin="*"
          data-message-type="ROUTE_CHANGE"
          data-include-search-params="true"
          data-only-in-iframe="true"
          data-debug="true"
          data-custom-data='{"appName": "YourApp", "version": "1.0.0", "greeting": "hi"}'
        />

        {/* ⭐ FIX: Wrap whole app in Web3Provider */}
        <Web3Provider>
          {children}
        </Web3Provider>

        <Toaster />
      </body>
    </html>
  );
}
