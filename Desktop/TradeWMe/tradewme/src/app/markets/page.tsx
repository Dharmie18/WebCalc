import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TokenList } from '@/components/markets/TokenList';
import { MarketOverview } from '@/components/MarketOverview';

export default function MarketsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 container py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Markets</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Track prices and trade volumes across all tokens
          </p>
        </div>

        <div className="space-y-6 md:space-y-8">
          <MarketOverview />
          <TokenList />
        </div>
      </main>

      <Footer />
    </div>
  );
}