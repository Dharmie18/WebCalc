import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h',
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 120 } // Cache for 2 minutes
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch market movers');
    }

    const coins = await response.json();

    // Sort by price change to get gainers and losers
    const sortedByChange = [...coins].sort((a, b) => 
      (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
    );

    const gainers = sortedByChange.slice(0, 5).map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      priceChange24h: coin.price_change_percentage_24h,
      image: coin.image,
      volume: coin.total_volume,
    }));

    const losers = sortedByChange.slice(-5).reverse().map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      priceChange24h: coin.price_change_percentage_24h,
      image: coin.image,
      volume: coin.total_volume,
    }));

    return NextResponse.json({ gainers, losers });
  } catch (error) {
    console.error('Error fetching market movers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch market movers' },
      { status: 500 }
    );
  }
}
