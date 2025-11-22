import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, users, user, session } from '@/db/schema';
import { eq, and, or, desc, gte, gt } from 'drizzle-orm';

async function verifyAdminAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);

  try {
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const sessionData = sessionRecord[0];
    
    if (new Date(sessionData.expiresAt) < new Date()) {
      return null;
    }

    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, sessionData.userId))
      .limit(1);

    if (userRecord.length === 0) {
      return null;
    }

    return userRecord[0];
  } catch (error) {
    console.error('Auth verification error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const authenticatedUser = await verifyAdminAuth(request);
    
    if (!authenticatedUser) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED' 
      }, { status: 401 });
    }

    const userWithRole = await db.select()
      .from(user)
      .where(eq(user.id, authenticatedUser.id))
      .limit(1);

    if (userWithRole.length === 0 || (userWithRole[0] as any).role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      failedTransactionsResult,
      suspiciousTransactionsResult,
      totalFailedCount,
      totalSuspiciousCount,
      failedLast24hCount,
      suspiciousLast24hCount
    ] = await Promise.all([
      db.select({
        id: transactions.id,
        txHash: transactions.txHash,
        type: transactions.type,
        status: transactions.status,
        tokenIn: transactions.tokenIn,
        tokenOut: transactions.tokenOut,
        amountIn: transactions.amountIn,
        amountOut: transactions.amountOut,
        gasFee: transactions.gasFee,
        timestamp: transactions.timestamp,
        userId: users.id,
        userEmail: users.email,
        userWalletAddress: users.walletAddress,
        userName: user.name,
      })
        .from(transactions)
        .innerJoin(users, eq(transactions.userId, users.id))
        .leftJoin(user, eq(users.email, user.email))
        .where(eq(transactions.status, 'failed'))
        .orderBy(desc(transactions.timestamp))
        .limit(100),

      db.select({
        id: transactions.id,
        txHash: transactions.txHash,
        type: transactions.type,
        status: transactions.status,
        tokenIn: transactions.tokenIn,
        tokenOut: transactions.tokenOut,
        amountIn: transactions.amountIn,
        amountOut: transactions.amountOut,
        gasFee: transactions.gasFee,
        timestamp: transactions.timestamp,
        userId: users.id,
        userEmail: users.email,
        userWalletAddress: users.walletAddress,
        userName: user.name,
      })
        .from(transactions)
        .innerJoin(users, eq(transactions.userId, users.id))
        .leftJoin(user, eq(users.email, user.email))
        .where(
          and(
            or(
              gt(transactions.gasFee, 100),
              gt(transactions.amountIn, 10000)
            ),
            or(
              eq(transactions.status, 'confirmed'),
              eq(transactions.status, 'pending')
            )
          )
        )
        .orderBy(desc(transactions.timestamp))
        .limit(100),

      db.select({ count: transactions.id })
        .from(transactions)
        .where(eq(transactions.status, 'failed'))
        .then(result => result.length),

      db.select({ count: transactions.id })
        .from(transactions)
        .where(
          and(
            or(
              gt(transactions.gasFee, 100),
              gt(transactions.amountIn, 10000)
            ),
            or(
              eq(transactions.status, 'confirmed'),
              eq(transactions.status, 'pending')
            )
          )
        )
        .then(result => result.length),

      db.select({ count: transactions.id })
        .from(transactions)
        .where(
          and(
            eq(transactions.status, 'failed'),
            gte(transactions.timestamp, twentyFourHoursAgo.toISOString())
          )
        )
        .then(result => result.length),

      db.select({ count: transactions.id })
        .from(transactions)
        .where(
          and(
            or(
              gt(transactions.gasFee, 100),
              gt(transactions.amountIn, 10000)
            ),
            or(
              eq(transactions.status, 'confirmed'),
              eq(transactions.status, 'pending')
            ),
            gte(transactions.timestamp, twentyFourHoursAgo.toISOString())
          )
        )
        .then(result => result.length)
    ]);

    const failedTransactions = failedTransactionsResult.map(tx => ({
      id: tx.id,
      txHash: tx.txHash,
      type: tx.type,
      status: tx.status,
      tokenIn: tx.tokenIn,
      tokenOut: tx.tokenOut,
      amountIn: tx.amountIn,
      amountOut: tx.amountOut,
      gasFee: tx.gasFee,
      timestamp: tx.timestamp,
      user: {
        id: tx.userId,
        name: tx.userName || 'Unknown',
        email: tx.userEmail,
        walletAddress: tx.userWalletAddress
      }
    }));

    const suspiciousTransactions = suspiciousTransactionsResult.map(tx => {
      const highGasFee = (tx.gasFee || 0) > 100;
      const highAmount = (tx.amountIn || 0) > 10000;
      
      let suspiciousReason = '';
      if (highGasFee && highAmount) {
        suspiciousReason = 'High gas fee (>100) and high amount (>10000)';
      } else if (highGasFee) {
        suspiciousReason = 'High gas fee (>100)';
      } else if (highAmount) {
        suspiciousReason = 'High amount (>10000)';
      }

      return {
        id: tx.id,
        txHash: tx.txHash,
        type: tx.type,
        status: tx.status,
        tokenIn: tx.tokenIn,
        tokenOut: tx.tokenOut,
        amountIn: tx.amountIn,
        amountOut: tx.amountOut,
        gasFee: tx.gasFee,
        timestamp: tx.timestamp,
        suspiciousReason,
        user: {
          id: tx.userId,
          name: tx.userName || 'Unknown',
          email: tx.userEmail,
          walletAddress: tx.userWalletAddress
        }
      };
    });

    return NextResponse.json({
      failedTransactions,
      suspiciousTransactions,
      summary: {
        totalFailed: totalFailedCount,
        totalSuspicious: totalSuspiciousCount,
        failedLast24h: failedLast24hCount,
        suspiciousLast24h: suspiciousLast24hCount
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET /api/admin/alerts error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}