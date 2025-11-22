'use client';

import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface MarketStats {
  totalMarketCap: number;
  totalVolume: number;
  btcDominance: number;
  activeMarkets: number;
  marketCapChange24h: number;
}

export function MarketOverview() {
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/market/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching market stats:', error);
      toast.error('Failed to fetch market stats');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
    toast.success('Market data refreshed');
  };

  const formatCurrency = (value: number) => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toFixed(2)}`;
  };

  const formatNumber = (value: number) => {
    if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
    return value.toString();
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 animate-pulse">
            <div className="h-20 bg-muted rounded" />
          </Card>
        ))}
      </div>
    );
  }

  const marketStats = stats ? [
    {
      label: 'Total Market Cap',
      value: formatCurrency(stats.totalMarketCap),
      change: `${stats.marketCapChange24h >= 0 ? '+' : ''}${stats.marketCapChange24h.toFixed(2)}%`,
      isPositive: stats.marketCapChange24h >= 0,
    },
    {
      label: '24h Volume',
      value: formatCurrency(stats.totalVolume),
      change: '+5.7%',
      isPositive: true,
    },
    {
      label: 'BTC Dominance',
      value: `${stats.btcDominance.toFixed(1)}%`,
      change: '-0.3%',
      isPositive: false,
    },
    {
      label: 'Active Markets',
      value: formatNumber(stats.activeMarkets),
      change: '+12.1%',
      isPositive: true,
    },
  ] : [];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {marketStats.map((stat, index) => (
          <Card 
            key={stat.label} 
            className="p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold mt-2 group-hover:text-primary transition-colors">{stat.value}</p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <div className="mt-4 flex items-center gap-2">
              {stat.isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
              <span
                className={`text-sm font-medium ${
                  stat.isPositive ? 'text-green-500' : 'text-red-500'
                }`}
              >
                {stat.change}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">24h</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}