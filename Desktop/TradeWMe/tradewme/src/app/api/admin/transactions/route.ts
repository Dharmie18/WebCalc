import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, users } from '@/db/schema';
import { desc, count, eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pageParam = searchParams.get('page');
    
    // Parse and validate page parameter
    const page = pageParam ? parseInt(pageParam) : 1;
    
    if (isNaN(page) || page < 1) {
      return NextResponse.json(
        { 
          error: 'Invalid page parameter. Must be a positive integer.',
          code: 'INVALID_PAGE_PARAMETER'
        },
        { status: 400 }
      );
    }

    // Pagination settings
    const limit = 50;
    const offset = (page - 1) * limit;

    // Run queries in parallel
    const [transactionResults, totalCountResult] = await Promise.all([
      // Get transactions with user email via LEFT JOIN
      db
        .select({
          id: transactions.id,
          userId: transactions.userId,
          userEmail: users.email,
          txHash: transactions.txHash,
          type: transactions.type,
          tokenIn: transactions.tokenIn,
          tokenOut: transactions.tokenOut,
          amountIn: transactions.amountIn,
          amountOut: transactions.amountOut,
          gasFee: transactions.gasFee,
          status: transactions.status,
          timestamp: transactions.timestamp,
        })
        .from(transactions)
        .leftJoin(users, eq(transactions.userId, users.id))
        .orderBy(desc(transactions.timestamp))
        .limit(limit)
        .offset(offset),
      
      // Get total count
      db
        .select({ count: count() })
        .from(transactions)
    ]);

    // Extract total count
    const total = totalCountResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        transactions: transactionResults,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('GET /api/admin/transactions error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}