'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame } from 'lucide-react';

const heatmapData = [
  { symbol: 'ETH', change: 8.4, size: 'large' },
  { symbol: 'SOL', change: 12.3, size: 'medium' },
  { symbol: 'AVAX', change: 6.7, size: 'medium' },
  { symbol: 'MATIC', change: -5.2, size: 'small' },
  { symbol: 'UNI', change: -4.1, size: 'small' },
  { symbol: 'LINK', change: -3.8, size: 'small' },
  { symbol: 'BTC', change: 3.2, size: 'large' },
  { symbol: 'USDC', change: 0.01, size: 'medium' },
  { symbol: 'ARB', change: 18.7, size: 'medium' },
  { symbol: 'OP', change: 22.3, size: 'small' },
];

export function MarketHeatmap() {
  const getColor = (change: number) => {
    if (change > 10) return 'bg-green-600';
    if (change > 5) return 'bg-green-500';
    if (change > 0) return 'bg-green-400';
    if (change === 0) return 'bg-gray-400';
    if (change > -5) return 'bg-red-400';
    if (change > -10) return 'bg-red-500';
    return 'bg-red-600';
  };

  const getSize = (size: string) => {
    switch (size) {
      case 'large':
        return 'col-span-2 row-span-2';
      case 'medium':
        return 'col-span-2 md:col-span-1';
      default:
        return 'col-span-1';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5" />
          Market Heatmap
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 auto-rows-[100px]">
          {heatmapData.map((token) => (
            <div
              key={token.symbol}
              className={`${getSize(token.size)} ${getColor(
                token.change
              )} rounded-lg p-3 md:p-4 flex flex-col justify-between text-white transition-transform hover:scale-105 cursor-pointer`}
            >
              <div>
                <p className="font-bold text-base md:text-lg">{token.symbol}</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold">
                  {token.change >= 0 ? '+' : ''}
                  {token.change.toFixed(2)}%
                </p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded"></div>
            <span className="text-muted-foreground">Strong Loss</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-400 rounded"></div>
            <span className="text-muted-foreground">Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded"></div>
            <span className="text-muted-foreground">Strong Gain</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}