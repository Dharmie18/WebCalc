'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PortfolioOverview } from '@/components/portfolio/PortfolioOverview';
import { PerformanceChart } from '@/components/portfolio/PerformanceChart';
import { TokenHoldings } from '@/components/portfolio/TokenHoldings';
import { TransactionHistory } from '@/components/portfolio/TransactionHistory';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

export default function PortfolioPage() {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        
        <main className="flex-1 container py-6 md:py-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] md:min-h-[600px] text-center px-4">
            <Wallet className="h-12 w-12 md:h-16 md:w-16 text-muted-foreground mb-4" />
            <h2 className="text-xl md:text-2xl font-bold mb-2">Connect Your Wallet</h2>
            <p className="text-sm md:text-base text-muted-foreground mb-6 md:mb-8 max-w-md">
              Connect your wallet to view your portfolio and track your holdings
            </p>
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <Button onClick={openConnectModal} size="lg">
                  Connect Wallet
                </Button>
              )}
            </ConnectButton.Custom>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 container py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Portfolio</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Track your holdings, performance, and transaction history
          </p>
        </div>

        <div className="space-y-6 md:space-y-8">
          <PortfolioOverview />
          <PerformanceChart />
          <TokenHoldings />
          <TransactionHistory />
        </div>
      </main>

      <Footer />
    </div>
  );
}