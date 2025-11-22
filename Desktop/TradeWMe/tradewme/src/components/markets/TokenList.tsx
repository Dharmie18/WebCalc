'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, TrendingUp, TrendingDown, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const tokens = [
  {
    symbol: 'ETH',
    name: 'Ethereum',
    price: 3245.67,
    change24h: 8.4,
    volume24h: 12500000000,
    marketCap: 390000000000,
    logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 64320.45,
    change24h: 3.2,
    volume24h: 28000000000,
    marketCap: 1260000000000,
    logo: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    price: 142.89,
    change24h: 12.3,
    volume24h: 3400000000,
    marketCap: 63000000000,
    logo: 'https://cryptologos.cc/logos/solana-sol-logo.png',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    price: 1.00,
    change24h: 0.01,
    volume24h: 5600000000,
    marketCap: 32000000000,
    logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
  {
    symbol: 'AVAX',
    name: 'Avalanche',
    price: 38.45,
    change24h: 6.7,
    volume24h: 890000000,
    marketCap: 14000000000,
    logo: 'https://cryptologos.cc/logos/avalanche-avax-logo.png',
  },
  {
    symbol: 'MATIC',
    name: 'Polygon',
    price: 0.89,
    change24h: -5.2,
    volume24h: 670000000,
    marketCap: 8200000000,
    logo: 'https://cryptologos.cc/logos/polygon-matic-logo.png',
  },
];

export function TokenList() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('market_cap');
  const [watchlist, setWatchlist] = useState<string[]>([]);

  const filteredTokens = tokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleWatchlist = (symbol: string) => {
    setWatchlist((prev) =>
      prev.includes(symbol)
        ? prev.filter((s) => s !== symbol)
        : [...prev, symbol]
    );
  };

  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="market_cap">Market Cap</SelectItem>
            <SelectItem value="volume">Volume</SelectItem>
            <SelectItem value="price">Price</SelectItem>
            <SelectItem value="change">24h Change</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Desktop Table View */}
      <Card className="hidden lg:block">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b">
                <tr className="text-left">
                  <th className="px-6 py-4 text-sm font-medium text-muted-foreground">
                    #
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-muted-foreground">
                    Name
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-muted-foreground text-right">
                    Price
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-muted-foreground text-right">
                    24h Change
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-muted-foreground text-right">
                    Volume (24h)
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-muted-foreground text-right">
                    Market Cap
                  </th>
                  <th className="px-6 py-4 text-sm font-medium text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTokens.map((token, index) => (
                  <tr
                    key={token.symbol}
                    className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => toggleWatchlist(token.symbol)}
                        >
                          <Star
                            className={`h-4 w-4 ${
                              watchlist.includes(token.symbol)
                                ? 'fill-yellow-500 text-yellow-500'
                                : ''
                            }`}
                          />
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          {index + 1}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/markets/${token.symbol.toLowerCase()}`}
                        className="flex items-center gap-3 hover:opacity-80"
                      >
                        <div className="h-8 w-8 rounded-full overflow-hidden">
                          <Image
                            src={token.logo}
                            alt={token.name}
                            width={32}
                            height={32}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{token.symbol}</p>
                          <p className="text-sm text-muted-foreground">
                            {token.name}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${token.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div
                        className={`flex items-center justify-end gap-1 ${
                          token.change24h >= 0
                            ? 'text-green-500'
                            : 'text-red-500'
                        }`}
                      >
                        {token.change24h >= 0 ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {token.change24h >= 0 ? '+' : ''}
                          {token.change24h.toFixed(2)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatNumber(token.volume24h)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {formatNumber(token.marketCap)}
                    </td>
                    <td className="px-6 py-4">
                      <Link href="/trade">
                        <Button size="sm" variant="outline">
                          Trade
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {filteredTokens.map((token, index) => (
          <Card key={token.symbol}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -ml-2"
                    onClick={() => toggleWatchlist(token.symbol)}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        watchlist.includes(token.symbol)
                          ? 'fill-yellow-500 text-yellow-500'
                          : ''
                      }`}
                    />
                  </Button>
                  <Link
                    href={`/markets/${token.symbol.toLowerCase()}`}
                    className="flex items-center gap-3"
                  >
                    <div className="h-10 w-10 rounded-full overflow-hidden">
                      <Image
                        src={token.logo}
                        alt={token.name}
                        width={40}
                        height={40}
                      />
                    </div>
                    <div>
                      <p className="font-semibold">{token.symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        {token.name}
                      </p>
                    </div>
                  </Link>
                </div>
                <div className="text-right">
                  <p className="font-bold">${token.price.toLocaleString()}</p>
                  <div
                    className={`flex items-center justify-end gap-1 text-sm ${
                      token.change24h >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}
                  >
                    {token.change24h >= 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>
                      {token.change24h >= 0 ? '+' : ''}
                      {token.change24h.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <p className="text-muted-foreground">Volume (24h)</p>
                  <p className="font-medium">{formatNumber(token.volume24h)}</p>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground">Market Cap</p>
                  <p className="font-medium">{formatNumber(token.marketCap)}</p>
                </div>
              </div>
              <Link href="/trade" className="block">
                <Button className="w-full" size="sm">
                  Trade
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}