import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { PriceAlerts } from '@/components/tools/PriceAlerts';
import { Watchlists } from '@/components/tools/Watchlists';
import { MarketHeatmap } from '@/components/tools/MarketHeatmap';
import { PremiumPlans } from '@/components/tools/PremiumPlans';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function ToolsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 container py-6 md:py-8">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold">Trading Tools</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Advanced tools to help you make better trading decisions
          </p>
        </div>

        <Tabs defaultValue="alerts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
            <TabsTrigger value="alerts" className="text-xs md:text-sm">Price Alerts</TabsTrigger>
            <TabsTrigger value="watchlists" className="text-xs md:text-sm">Watchlists</TabsTrigger>
            <TabsTrigger value="heatmap" className="text-xs md:text-sm">Heatmap</TabsTrigger>
            <TabsTrigger value="premium" className="text-xs md:text-sm">Premium</TabsTrigger>
          </TabsList>

          <TabsContent value="alerts">
            <PriceAlerts />
          </TabsContent>

          <TabsContent value="watchlists">
            <Watchlists />
          </TabsContent>

          <TabsContent value="heatmap">
            <MarketHeatmap />
          </TabsContent>

          <TabsContent value="premium">
            <PremiumPlans />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
}