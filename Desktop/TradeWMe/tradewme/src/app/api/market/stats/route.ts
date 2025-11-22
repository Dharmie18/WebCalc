import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/global',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 } // Cache for 60 seconds
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch market data');
    }

    const data = await response.json();
    const globalData = data.data;

    return NextResponse.json({
      totalMarketCap: globalData.total_market_cap.usd,
      totalVolume: globalData.total_volume.usd,
      btcDominance: globalData.market_cap_percentage.btc,
      activeMarkets: globalData.markets,
      marketCapChange24h: globalData.market_cap_change_percentage_24h_usd,
    });
  } catch (error) {
    console.error('Error fetching market stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market statistics' },
      { status: 500 }
    );
  }
}
