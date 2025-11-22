'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, RefreshCw, Star, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TrendingToken {
  id: string;
  symbol: string;
  name: string;
  price: string;
  priceChange24h: number;
  volume: string;
  marketCapRank: number;
  image: string;
}

export function TrendingTokens() {
  const [tokens, setTokens] = useState<TrendingToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [hoveredToken, setHoveredToken] = useState<string | null>(null);

  const fetchTrending = async () => {
    try {
      const response = await fetch('/api/market/trending');
      if (response.ok) {
        const data = await response.json();
        setTokens(data);
      }
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrending();
    const interval = setInterval(fetchTrending, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTrending();
    toast.success('Trending tokens refreshed');
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

  const formatVolume = (volume: string | number) => {
    if (typeof volume === 'string' && volume === 'N/A') return 'N/A';
    const num = typeof volume === 'string' ? parseFloat(volume) : volume;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
    return `$${num.toFixed(0)}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Trending Tokens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
            <Flame className="h-5 w-5 text-orange-500" />
            Trending Tokens
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 md:space-y-4">
          {tokens.slice(0, 5).map((token, index) => (
            <div 
              key={token.id} 
              className="flex items-center gap-3 md:gap-4 p-3 rounded-lg hover:bg-muted/50 transition-all cursor-pointer group relative"
              onMouseEnter={() => setHoveredToken(token.id)}
              onMouseLeave={() => setHoveredToken(null)}
            >
              <div className="flex h-6 w-6 md:h-8 md:w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-xs md:text-sm font-bold">
                {index + 1}
              </div>
              <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden group-hover:scale-110 transition-transform">
                <Image src={token.image} alt={token.name} width={40} height={40} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm md:text-base truncate">{token.symbol.toUpperCase()}</p>
                <p className="text-xs md:text-sm text-muted-foreground truncate">{token.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium text-sm md:text-base">{token.price}</p>
                <p className="text-xs text-muted-foreground">{formatVolume(token.volume)}</p>
              </div>
              <Badge 
                variant="outline" 
                className={`${
                  token.priceChange24h >= 0 
                    ? 'text-green-500 border-green-500' 
                    : 'text-red-500 border-red-500'
                } whitespace-nowrap`}
              >
                {token.priceChange24h >= 0 ? '+' : ''}{token.priceChange24h.toFixed(1)}%
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => toggleWatchlist(token.id, e)}
                >
                  <Star className={`h-4 w-4 ${watchlist.has(token.id) ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    toast.info('View details coming soon');
                  }}
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}