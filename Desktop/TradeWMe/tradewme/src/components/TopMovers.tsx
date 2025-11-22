'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, RefreshCw, Star } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Token {
  id: string;
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  image: string;
  volume: number;
}

interface MoversData {
  gainers: Token[];
  losers: Token[];
}

export function TopMovers() {
  const [movers, setMovers] = useState<MoversData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());

  const fetchMovers = async () => {
    try {
      const response = await fetch('/api/market/movers');
      if (response.ok) {
        const data = await response.json();
        setMovers(data);
      }
    } catch (error) {
      console.error('Error fetching market movers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMovers();
    const interval = setInterval(fetchMovers, 120000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchMovers();
    toast.success('Top movers refreshed');
  };

  const toggleWatchlist = (tokenId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setWatchlist(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tokenId)) {
        newSet.delete(tokenId);
        toast.success('Removed from watchlist');
      } else {
        newSet.add(tokenId);
        toast.success('Added to watchlist');
      }
      return newSet;
    });
  };

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-32 bg-muted rounded" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-16 bg-muted rounded" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

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
      <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Top Gainers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            {movers?.gainers.slice(0, 3).map((token) => (
              <div 
                key={token.id} 
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                    <Image src={token.image} alt={token.name} width={40} height={40} />
                  </div>
                  <div>
                    <p className="font-medium text-sm md:text-base">{token.symbol}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{token.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-medium text-sm md:text-base">{formatPrice(token.price)}</p>
                    <p className="text-xs md:text-sm text-green-500 font-medium">
                      +{token.priceChange24h.toFixed(2)}%
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => toggleWatchlist(token.id, e)}
                  >
                    <Star className={`h-4 w-4 ${watchlist.has(token.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
              <TrendingDown className="h-5 w-5 text-red-500" />
              Top Losers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 md:space-y-4">
            {movers?.losers.slice(0, 3).map((token) => (
              <div 
                key={token.id} 
                className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-2 md:gap-3">
                  <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                    <Image src={token.image} alt={token.name} width={40} height={40} />
                  </div>
                  <div>
                    <p className="font-medium text-sm md:text-base">{token.symbol}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{token.name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <p className="font-medium text-sm md:text-base">{formatPrice(token.price)}</p>
                    <p className="text-xs md:text-sm text-red-500 font-medium">
                      {token.priceChange24h.toFixed(2)}%
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => toggleWatchlist(token.id, e)}
                  >
                    <Star className={`h-4 w-4 ${watchlist.has(token.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}