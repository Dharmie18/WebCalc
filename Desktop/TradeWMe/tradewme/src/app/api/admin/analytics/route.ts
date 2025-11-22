import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users, transactions, user, session } from '@/db/schema';
import { eq, and, gte, desc, sql, count, sum, avg } from 'drizzle-orm';

async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header', status: 401 };
  }

  const token = authHeader.substring(7);

  try {
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return { error: 'Invalid session token', status: 401 };
    }

    const userSession = sessionRecord[0];

    if (new Date(userSession.expiresAt) < new Date()) {
      return { error: 'Session expired', status: 401 };
    }

    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (userRecord.length === 0) {
      return { error: 'User not found', status: 401 };
    }

    const authenticatedUser = userRecord[0];

    if (!authenticatedUser.role || authenticatedUser.role !== 'admin') {
      return { error: 'Access denied. Admin privileges required', status: 403 };
    }

    return { user: authenticatedUser };
  } catch (error) {
    console.error('Auth verification error:', error);
    return { error: 'Authentication failed', status: 500 };
  }
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAuth(request);
    
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const [
      totalUsersResult,
      activeUsersResult,
      transactionStatsResult,
      volumeStatsResult,
      pendingTransactionsResult,
      failedTransactionsResult,
      completedTransactionsResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      
      db.select({ 
        count: sql<number>`COUNT(DISTINCT ${transactions.userId})` 
      })
      .from(transactions)
      .where(gte(transactions.timestamp, thirtyDaysAgoISO)),
      
      db.select({ 
        count: count(),
        avgAmount: avg(transactions.amountOut),
        avgGas: avg(transactions.gasFee),
        totalGas: sum(transactions.gasFee)
      }).from(transactions),
      
      db.select({ 
        totalVolume: sql<number>`COALESCE(SUM(${transactions.amountOut}), 0)` 
      }).from(transactions),
      
      db.select({ count: count() })
        .from(transactions)
        .where(eq(transactions.status, 'pending')),
      
      db.select({ count: count() })
        .from(transactions)
        .where(eq(transactions.status, 'failed')),
      
      db.select({ count: count() })
        .from(transactions)
        .where(eq(transactions.status, 'confirmed')),
    ]);

    const totalUsers = totalUsersResult[0]?.count ?? 0;
    const activeUsers = Number(activeUsersResult[0]?.count ?? 0);
    const totalTransactions = transactionStatsResult[0]?.count ?? 0;
    const averageTransactionValue = Number(transactionStatsResult[0]?.avgAmount ?? 0);
    const averageGasFee = Number(transactionStatsResult[0]?.avgGas ?? 0);
    const totalGasPaid = Number(transactionStatsResult[0]?.totalGas ?? 0);
    const totalVolumeUsd = Number(volumeStatsResult[0]?.totalVolume ?? 0);
    const pendingTransactions = pendingTransactionsResult[0]?.count ?? 0;
    const failedTransactions = failedTransactionsResult[0]?.count ?? 0;
    const completedTransactions = completedTransactionsResult[0]?.count ?? 0;

    const tokenInData = await db.select({
      token: transactions.tokenIn,
      count: count(),
      volume: sql<number>`COALESCE(SUM(${transactions.amountIn}), 0)`
    })
    .from(transactions)
    .where(sql`${transactions.tokenIn} IS NOT NULL`)
    .groupBy(transactions.tokenIn);

    const tokenOutData = await db.select({
      token: transactions.tokenOut,
      count: count(),
      volume: sql<number>`COALESCE(SUM(${transactions.amountOut}), 0)`
    })
    .from(transactions)
    .where(sql`${transactions.tokenOut} IS NOT NULL`)
    .groupBy(transactions.tokenOut);

    const tokenMap = new Map<string, { token: string; count: number; volume: number }>();

    tokenInData.forEach(item => {
      if (item.token) {
        const existing = tokenMap.get(item.token) || { token: item.token, count: 0, volume: 0 };
        existing.count += item.count;
        existing.volume += Number(item.volume);
        tokenMap.set(item.token, existing);
      }
    });

    tokenOutData.forEach(item => {
      if (item.token) {
        const existing = tokenMap.get(item.token) || { token: item.token, count: 0, volume: 0 };
        existing.count += item.count;
        existing.volume += Number(item.volume);
        tokenMap.set(item.token, existing);
      }
    });

    const mostTradedTokens = Array.from(tokenMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const volumeByDayData = await db.select({
      date: sql<string>`date(${transactions.timestamp})`,
      volume: sql<number>`COALESCE(SUM(${transactions.amountOut}), 0)`,
      count: count()
    })
    .from(transactions)
    .where(gte(transactions.timestamp, thirtyDaysAgoISO))
    .groupBy(sql`date(${transactions.timestamp})`)
    .orderBy(desc(sql`date(${transactions.timestamp})`));

    const transactionVolumeByDay = volumeByDayData.map(item => ({
      date: item.date,
      volume: Number(item.volume),
      count: item.count
    }));

    const userGrowthData = await db.select({
      date: sql<string>`date(${users.createdAt})`,
      newUsers: count()
    })
    .from(users)
    .where(gte(users.createdAt, thirtyDaysAgoISO))
    .groupBy(sql`date(${users.createdAt})`)
    .orderBy(desc(sql`date(${users.createdAt})`));

    const userGrowth = userGrowthData.map(item => ({
      date: item.date,
      newUsers: item.newUsers
    }));

    const analytics = {
      totalUsers,
      activeUsers,
      totalTransactions,
      pendingTransactions,
      failedTransactions,
      completedTransactions,
      totalVolumeUsd,
      mostTradedTokens,
      transactionVolumeByDay,
      userGrowth,
      averageTransactionValue,
      averageGasFee,
      totalGasPaid
    };

    return NextResponse.json(analytics, { status: 200 });

  } catch (error) {
    console.error('GET /api/admin/analytics error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}