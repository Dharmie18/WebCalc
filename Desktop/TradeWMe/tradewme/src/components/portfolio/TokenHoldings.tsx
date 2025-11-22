'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const holdings = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    amount: 5.234,
    price: 3245.67,
    value: 16988.44,
    change: 8.4,
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    amount: 15000,
    price: 1.00,
    value: 15000,
    change: 0.01,
    logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    amount: 45.67,
    price: 142.89,
    value: 6524.76,
    change: 12.3,
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.png',
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    amount: 120.5,
    price: 38.45,
    value: 4633.23,
    change: 6.7,
    logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
  },
  {
    symbol: 'UNI',
    name: 'Uniswap',
    amount: 250,
    price: 8.92,
    value: 2230,
    change: -4.1,
    logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png',
  },
];

export function TokenHoldings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Desktop View */}
        <div className="hidden md:block space-y-4">
          {holdings.map((holding) => (
            <div
              key={holding.symbol}
              className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full overflow-hidden">
                  <Image
                    src={holding.logo}
                    alt={holding.name}
                    width={48}
                    height={48}
                  />
                </div>
                <div>
                  <p className="font-semibold">{holding.symbol}</p>
                  <p className="text-sm text-muted-foreground">{holding.name}</p>
                </div>
              </div>

              <div className="text-center">
                <p className="font-medium">
                  {holding.amount.toLocaleString()} {holding.symbol}
                </p>
                <p className="text-sm text-muted-foreground">
                  @ ${holding.price.toLocaleString()}
                </p>
              </div>

              <div className="text-right">
                <p className="font-semibold">
                  ${holding.value.toLocaleString()}
                </p>
                <div
                  className={`flex items-center justify-end gap-1 text-sm ${
                    holding.change >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {holding.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {holding.change >= 0 ? '+' : ''}
                    {holding.change.toFixed(2)}%
                  </span>
                </div>
              </div>

              <Link href="/trade">
                <Button size="sm" variant="outline">
                  Trade
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden space-y-4">
          {holdings.map((holding) => (
            <div
              key={holding.symbol}
              className="p-4 rounded-lg border bg-muted/30"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden">
                    <Image
                      src={holding.logo}
                      alt={holding.name}
                      width={40}
                      height={40}
                    />
                  </div>
                  <div>
                    <p className="font-semibold">{holding.symbol}</p>
                    <p className="text-xs text-muted-foreground">{holding.name}</p>
                  </div>
                </div>
                <div
                  className={`flex items-center gap-1 text-sm ${
                    holding.change >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {holding.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {holding.change >= 0 ? '+' : ''}
                    {holding.change.toFixed(2)}%
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">{holding.amount.toLocaleString()} {holding.symbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Value</p>
                  <p className="font-semibold">${holding.value.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground mb-3">
                @ ${holding.price.toLocaleString()} per token
              </div>
              
              <Link href="/trade" className="block">
                <Button size="sm" variant="outline" className="w-full">
                  Trade
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}