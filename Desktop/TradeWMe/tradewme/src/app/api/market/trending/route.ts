import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/search/trending',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 300 } // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch trending tokens');
    }

    const data = await response.json();
    
    const trending = data.coins.slice(0, 6).map((item: any) => ({
      id: item.item.id,
      symbol: item.item.symbol,
      name: item.item.name,
      price: item.item.data?.price || 'N/A',
      priceChange24h: item.item.data?.price_change_percentage_24h?.usd || 0,
      volume: item.item.data?.total_volume || 'N/A',
      marketCapRank: item.item.market_cap_rank,
      image: item.item.large,
    }));

    return NextResponse.json(trending);
  } catch (error) {
    console.error('Error fetching trending tokens:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trending tokens' },
      { status: 500 }
    );
  }
}
