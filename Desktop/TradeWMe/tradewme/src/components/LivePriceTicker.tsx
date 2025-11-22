'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TickerToken {
  symbol: string;
  price: number;
  change24h: number;
}

export function LivePriceTicker() {
  const [tokens, setTokens] = useState<TickerToken[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/market/trending');
        if (response.ok) {
          const data = await response.json();
          const tickerData = data.slice(0, 10).map((token: any) => ({
            symbol: token.symbol.toUpperCase(),
            price: parseFloat(token.price.replace(/[$,]/g, '')),
            change24h: token.priceChange24h
          }));
          setTokens(tickerData);
        }
      } catch (error) {
        console.error('Error fetching ticker prices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading || tokens.length === 0) {
    return null;
  }

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    if (price < 100) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(0)}`;
  };

  return (
    <div className="border-b bg-muted/30 overflow-hidden">
      <div className="relative flex">
        <div className="flex animate-ticker gap-8 py-2">
          {/* Duplicate the array to create seamless loop */}
          {[...tokens, ...tokens].map((token, index) => (
            <div key={index} className="flex items-center gap-2 whitespace-nowrap px-4">
              <span className="font-semibold text-sm">{token.symbol}</span>
              <span className="text-sm">{formatPrice(token.price)}</span>
              <div className={`flex items-center gap-1 ${token.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {token.change24h >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span className="text-xs font-medium">
                  {token.change24h >= 0 ? '+' : ''}{token.change24h.toFixed(2)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
