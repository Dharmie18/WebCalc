'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowDownUp, Settings2, Zap } from 'lucide-react';
import { TokenSelector } from './TokenSelector';
import { SlippageSettings } from './SlippageSettings';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function SwapInterface() {
  const { isConnected } = useAccount();
  const [tokenIn, setTokenIn] = useState({ symbol: 'ETH', address: '0xEth', logo: 'https://cryptologos.cc/logos/ethereum-eth-logo.png' });
  const [tokenOut, setTokenOut] = useState({ symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', logo: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png' });
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSwapTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
    setAmountIn(amountOut);
    setAmountOut(amountIn);
  };

  const handleSwap = async () => {
    if (!isConnected) return;
    
    setIsLoading(true);
    try {
      // Call swap API
      const response = await fetch('/api/swap/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokenIn: tokenIn.address,
          tokenOut: tokenOut.address,
          amount: amountIn,
          slippage,
        }),
      });
      
      const data = await response.json();
      console.log('Swap quote:', data);
      // Execute swap transaction here
    } catch (error) {
      console.error('Swap failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg md:text-xl">Swap</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings2 className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showSettings && (
          <SlippageSettings value={slippage} onChange={setSlippage} />
        )}

        {/* Token In */}
        <div className="space-y-2">
          <Label className="text-sm">From</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.0"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="text-xl md:text-2xl h-12 md:h-14"
              />
            </div>
            <TokenSelector
              selectedToken={tokenIn}
              onSelect={setTokenIn}
            />
          </div>
          <div className="flex justify-between text-xs md:text-sm text-muted-foreground">
            <span>Balance: 1.234 {tokenIn.symbol}</span>
            <Button variant="link" size="sm" className="h-auto p-0 text-xs md:text-sm">
              MAX
            </Button>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={handleSwapTokens}
            className="rounded-full h-10 w-10"
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Token Out */}
        <div className="space-y-2">
          <Label className="text-sm">To</Label>
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                type="number"
                placeholder="0.0"
                value={amountOut}
                onChange={(e) => setAmountOut(e.target.value)}
                className="text-xl md:text-2xl h-12 md:h-14"
              />
            </div>
            <TokenSelector
              selectedToken={tokenOut}
              onSelect={setTokenOut}
            />
          </div>
          <div className="text-xs md:text-sm text-muted-foreground">
            Balance: 456.78 {tokenOut.symbol}
          </div>
        </div>

        {/* Swap Details */}
        {amountIn && amountOut && (
          <div className="rounded-lg border bg-muted/40 p-3 md:p-4 space-y-2">
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-muted-foreground">Rate</span>
              <span className="font-medium">
                1 {tokenIn.symbol} = {(parseFloat(amountOut) / parseFloat(amountIn)).toFixed(4)} {tokenOut.symbol}
              </span>
            </div>
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-muted-foreground">Price Impact</span>
              <span className="text-green-500">{'<0.01%'}</span>
            </div>
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-muted-foreground">Estimated Gas</span>
              <span className="font-medium">$2.45</span>
            </div>
            <div className="flex justify-between text-xs md:text-sm">
              <span className="text-muted-foreground">Minimum Received</span>
              <span className="font-medium">
                {(parseFloat(amountOut) * (1 - slippage / 100)).toFixed(4)} {tokenOut.symbol}
              </span>
            </div>
          </div>
        )}

        {/* Swap Button */}
        {!isConnected ? (
          <ConnectButton.Custom>
            {({ openConnectModal }) => (
              <Button onClick={openConnectModal} className="w-full" size="lg">
                Connect Wallet
              </Button>
            )}
          </ConnectButton.Custom>
        ) : (
          <Button
            onClick={handleSwap}
            className="w-full gap-2"
            size="lg"
            disabled={!amountIn || !amountOut || isLoading}
          >
            {isLoading ? (
              'Swapping...'
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Swap
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}