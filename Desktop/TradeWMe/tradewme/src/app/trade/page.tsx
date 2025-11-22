'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { SwapInterface } from '@/components/trade/SwapInterface';
import { RecentTrades } from '@/components/trade/RecentTrades';
import dynamic from 'next/dynamic';

const TradingChart = dynamic(() => import('@/components/trade/TradingChart'), {
  loading: () => (
    <div className="h-[400px] md:h-[600px] rounded-lg border bg-muted animate-pulse" />
  ),
});

export default function TradePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 container py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Trade</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Swap tokens at the best rates across all DEXs
          </p>
        </div>

        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {/* Main Chart Area */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6 order-2 lg:order-1">
            <TradingChart />
          </div>

          {/* Swap Interface Sidebar */}
          <div className="space-y-4 md:space-y-6 order-1 lg:order-2">
            <SwapInterface />
            <RecentTrades />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}