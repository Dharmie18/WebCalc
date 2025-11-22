import { NextRequest, NextResponse } from 'next/server';

// This endpoint proxies requests to DEX aggregators like 1inch or 0x
// In production, you'd use actual API keys and handle rate limiting

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tokenIn, tokenOut, amount, slippage, chainId = 1 } = body;

    // Validate required fields
    if (!tokenIn || !tokenOut || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: tokenIn, tokenOut, amount' },
        { status: 400 }
      );
    }

    // Mock response - In production, integrate with 1inch or 0x API
    // Example: https://api.1inch.dev/swap/v5.2/1/quote
    
    const mockQuote = {
      tokenIn,
      tokenOut,
      amountIn: amount,
      amountOut: calculateMockOutput(amount, tokenIn, tokenOut),
      estimatedGas: '0.002',
      gasCostUSD: '2.45',
      priceImpact: '0.01',
      route: [
        {
          protocol: 'Uniswap V3',
          percentage: 60,
        },
        {
          protocol: 'SushiSwap',
          percentage: 40,
        },
      ],
      minimumReceived: calculateMinimumReceived(amount, slippage),
      slippage,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(mockQuote, { status: 200 });
  } catch (error) {
    console.error('Quote error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// Helper functions for mock data
function calculateMockOutput(amountIn: string, tokenIn: string, tokenOut: string): string {
  // Mock exchange rates
  const rates: Record<string, number> = {
    'ETH-USDC': 3245.67,
    'USDC-ETH': 1 / 3245.67,
    'ETH-USDT': 3244.32,
    'USDT-ETH': 1 / 3244.32,
    'WBTC-ETH': 15.2,
    'ETH-WBTC': 1 / 15.2,
  };

  const pair = `${tokenIn.includes('Eth') ? 'ETH' : 'USDC'}-${tokenOut.includes('A0b') ? 'USDC' : 'ETH'}`;
  const rate = rates[pair] || 1;
  
  return (parseFloat(amountIn) * rate).toFixed(6);
}

function calculateMinimumReceived(amount: string, slippage: number): string {
  const slippageDecimal = slippage / 100;
  return (parseFloat(amount) * (1 - slippageDecimal)).toFixed(6);
}

export async function GET() {
  return NextResponse.json(
    { message: 'Use POST method to get swap quotes' },
    { status: 405 }
  );
}
