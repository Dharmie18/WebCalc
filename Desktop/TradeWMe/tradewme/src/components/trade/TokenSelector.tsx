'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ChevronDown, Search } from 'lucide-react';
import Image from 'next/image';

interface Token {
  symbol: string;
  address: string;
  logo: string;
  name?: string;
}

const popularTokens: Token[] = [
  { symbol: 'ETH', address: '0xEth', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png', name: 'Ethereum' },
  { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png', name: 'USD Coin' },
  { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', logo: 'https://cryptologos.cc/logos/tether-usdt-logo.png', name: 'Tether' },
  { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', logo: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png', name: 'Wrapped Bitcoin' },
  { symbol: 'DAI', address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', logo: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png', name: 'Dai' },
  { symbol: 'UNI', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', logo: 'https://cryptologos.cc/logos/uniswap-uni-logo.png', name: 'Uniswap' },
];

interface TokenSelectorProps {
  selectedToken: Token;
  onSelect: (token: Token) => void;
}

export function TokenSelector({ selectedToken, onSelect }: TokenSelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTokens = popularTokens.filter(
    (token) =>
      token.symbol.toLowerCase().includes(search.toLowerCase()) ||
      token.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (token: Token) => {
    onSelect(token);
    setOpen(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 min-w-[120px]">
          <div className="h-6 w-6 rounded-full overflow-hidden">
            <Image
              src={selectedToken.logo}
              alt={selectedToken.symbol}
              width={24}
              height={24}
            />
          </div>
          <span className="font-semibold">{selectedToken.symbol}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select a token</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search tokens..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-[400px] overflow-y-auto space-y-1">
            {filteredTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => handleSelect(token)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="h-10 w-10 rounded-full overflow-hidden">
                  <Image
                    src={token.logo}
                    alt={token.symbol}
                    width={40}
                    height={40}
                  />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold">{token.symbol}</p>
                  <p className="text-sm text-muted-foreground">{token.name}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">0.00</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
