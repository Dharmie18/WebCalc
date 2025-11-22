import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, users, subscriptions } from '@/db/schema';
import { desc, eq } from 'drizzle-orm';

interface Activity {
  id: string;
  type: 'transaction' | 'new_user' | 'new_subscription';
  timestamp: string;
  userId: number;
  userEmail: string;
  details: object;
}

export async function GET(request: NextRequest) {
  try {
    // Fetch data in parallel
    const [recentTransactions, recentUsers, recentSubscriptions] = await Promise.all([
      // Recent 10 transactions with user email
      db.select({
        transactionId: transactions.id,
        userId: transactions.userId,
        txHash: transactions.txHash,
        type: transactions.type,
        tokenIn: transactions.tokenIn,
        tokenOut: transactions.tokenOut,
        amountOut: transactions.amountOut,
        status: transactions.status,
        timestamp: transactions.timestamp,
        userEmail: users.email,
      })
        .from(transactions)
        .leftJoin(users, eq(transactions.userId, users.id))
        .orderBy(desc(transactions.timestamp))
        .limit(10),

      // Recent 10 new users
      db.select()
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(10),

      // Recent 10 new subscriptions with user email
      db.select({
        subscriptionId: subscriptions.id,
        userId: subscriptions.userId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        createdAt: subscriptions.createdAt,
        userEmail: users.email,
      })
        .from(subscriptions)
        .leftJoin(users, eq(subscriptions.userId, users.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(10),
    ]);

    // Transform transactions into activity format
    const transactionActivities: Activity[] = recentTransactions.map(tx => ({
      id: `transaction-${tx.transactionId}`,
      type: 'transaction' as const,
      timestamp: tx.timestamp,
      userId: tx.userId,
      userEmail: tx.userEmail || '',
      details: {
        txHash: tx.txHash,
        transactionType: tx.type,
        tokenIn: tx.tokenIn,
        tokenOut: tx.tokenOut,
        amountOut: tx.amountOut,
        status: tx.status,
      },
    }));

    // Transform users into activity format
    const userActivities: Activity[] = recentUsers.map(user => ({
      id: `user-${user.id}`,
      type: 'new_user' as const,
      timestamp: user.createdAt,
      userId: user.id,
      userEmail: user.email,
      details: {
        email: user.email,
        joinedAt: user.createdAt,
      },
    }));

    // Transform subscriptions into activity format
    const subscriptionActivities: Activity[] = recentSubscriptions.map(sub => ({
      id: `subscription-${sub.subscriptionId}`,
      type: 'new_subscription' as const,
      timestamp: sub.createdAt,
      userId: sub.userId,
      userEmail: sub.userEmail || '',
      details: {
        plan: sub.plan,
        status: sub.status,
      },
    }));

    // Combine all activities
    const allActivities = [
      ...transactionActivities,
      ...userActivities,
      ...subscriptionActivities,
    ];

    // Sort by timestamp descending
    allActivities.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    // Return only the most recent 20 activities
    const recentActivities = allActivities.slice(0, 20);

    return NextResponse.json({
      activities: recentActivities,
    }, { status: 200 });

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
    }, { status: 500 });
  }
}