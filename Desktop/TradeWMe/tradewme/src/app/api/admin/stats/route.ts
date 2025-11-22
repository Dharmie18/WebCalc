import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, transactions, subscriptions, portfolios, watchlists, priceAlerts } from '@/db/schema';
import { eq, ne, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Execute all queries in parallel for optimal performance
    const [
      totalUsersResult,
      totalTransactionsResult,
      totalTransactionVolumeResult,
      activeSubscriptionsResult,
      premiumUsersResult,
      totalPortfoliosResult,
      totalWatchlistsResult,
      totalPriceAlertsResult
    ] = await Promise.all([
      // Total users count
      db.select({ count: sql<number>`count(*)` })
        .from(users),

      // Total transactions count
      db.select({ count: sql<number>`count(*)` })
        .from(transactions),

      // Total transaction volume (sum of amountOut, handling null values)
      db.select({ 
        total: sql<number>`COALESCE(SUM(${transactions.amountOut}), 0)` 
      })
        .from(transactions),

      // Active subscriptions count
      db.select({ count: sql<number>`count(*)` })
        .from(subscriptions)
        .where(eq(subscriptions.status, 'active')),

      // Premium users count (where premiumTier != 'free')
      db.select({ count: sql<number>`count(*)` })
        .from(users)
        .where(ne(users.premiumTier, 'free')),

      // Total portfolios count
      db.select({ count: sql<number>`count(*)` })
        .from(portfolios),

      // Total watchlists count
      db.select({ count: sql<number>`count(*)` })
        .from(watchlists),

      // Total price alerts count
      db.select({ count: sql<number>`count(*)` })
        .from(priceAlerts)
    ]);

    // Extract values from query results
    const totalUsers = totalUsersResult[0]?.count ?? 0;
    const totalTransactions = totalTransactionsResult[0]?.count ?? 0;
    const totalTransactionVolume = totalTransactionVolumeResult[0]?.total ?? 0;
    const activeSubscriptions = activeSubscriptionsResult[0]?.count ?? 0;
    const premiumUsers = premiumUsersResult[0]?.count ?? 0;
    const totalPortfolios = totalPortfoliosResult[0]?.count ?? 0;
    const totalWatchlists = totalWatchlistsResult[0]?.count ?? 0;
    const totalPriceAlerts = totalPriceAlertsResult[0]?.count ?? 0;

    return NextResponse.json({
      totalUsers,
      totalTransactions,
      totalTransactionVolume,
      activeSubscriptions,
      premiumUsers,
      totalPortfolios,
      totalWatchlists,
      totalPriceAlerts
    }, { status: 200 });

  } catch (error) {
    console.error('GET admin stats error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}