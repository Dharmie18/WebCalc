import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, users, user, session } from '@/db/schema';
import { eq, like, and, or, gte, lte, desc, asc, count, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication required',
        code: 'MISSING_AUTH_TOKEN' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify session
    const sessionRecord = await db.select()
      .from(session)
      .where(eq(session.token, token))
      .limit(1);

    if (sessionRecord.length === 0) {
      return NextResponse.json({ 
        error: 'Invalid or expired session',
        code: 'INVALID_SESSION' 
      }, { status: 401 });
    }

    const userSession = sessionRecord[0];

    // Check if session is expired
    if (new Date(userSession.expiresAt) < new Date()) {
      return NextResponse.json({ 
        error: 'Session expired',
        code: 'SESSION_EXPIRED' 
      }, { status: 401 });
    }

    // Get user and verify admin role
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, userSession.userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 401 });
    }

    const currentUser = userRecord[0];

    if (currentUser.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS' 
      }, { status: 403 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));
    const offset = (page - 1) * limit;

    const status = searchParams.get('status');
    const userIdParam = searchParams.get('userId');
    const walletAddress = searchParams.get('walletAddress');
    const tokenSymbol = searchParams.get('tokenSymbol');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sortBy = searchParams.get('sortBy') ?? 'timestamp';
    const sortOrder = searchParams.get('sortOrder') ?? 'desc';
    const search = searchParams.get('search');

    // Validate status
    if (status && !['pending', 'confirmed', 'failed'].includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status. Must be one of: pending, confirmed, failed',
        code: 'INVALID_STATUS' 
      }, { status: 400 });
    }

    // Validate sortBy
    const validSortFields = ['timestamp', 'amountIn', 'amountOut', 'gasFee'];
    if (!validSortFields.includes(sortBy)) {
      return NextResponse.json({ 
        error: `Invalid sortBy field. Must be one of: ${validSortFields.join(', ')}`,
        code: 'INVALID_SORT_FIELD' 
      }, { status: 400 });
    }

    // Validate sortOrder
    if (!['asc', 'desc'].includes(sortOrder)) {
      return NextResponse.json({ 
        error: 'Invalid sortOrder. Must be asc or desc',
        code: 'INVALID_SORT_ORDER' 
      }, { status: 400 });
    }

    // Validate dates
    let startDateTime: Date | null = null;
    let endDateTime: Date | null = null;

    if (startDate) {
      startDateTime = new Date(startDate);
      if (isNaN(startDateTime.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid startDate format. Use ISO date string',
          code: 'INVALID_START_DATE' 
        }, { status: 400 });
      }
    }

    if (endDate) {
      endDateTime = new Date(endDate);
      if (isNaN(endDateTime.getTime())) {
        return NextResponse.json({ 
          error: 'Invalid endDate format. Use ISO date string',
          code: 'INVALID_END_DATE' 
        }, { status: 400 });
      }
    }

    // Validate userId if provided
    let userIdInt: number | null = null;
    if (userIdParam) {
      userIdInt = parseInt(userIdParam);
      if (isNaN(userIdInt)) {
        return NextResponse.json({ 
          error: 'Invalid userId. Must be a valid integer',
          code: 'INVALID_USER_ID' 
        }, { status: 400 });
      }
    }

    // Build WHERE conditions
    const conditions = [];

    if (status) {
      conditions.push(eq(transactions.status, status));
    }

    if (userIdInt !== null) {
      conditions.push(eq(transactions.userId, userIdInt));
    }

    if (walletAddress) {
      // Need to filter transactions where user has this wallet address
      const usersWithWallet = await db.select({ id: users.id })
        .from(users)
        .where(eq(users.walletAddress, walletAddress));
      
      if (usersWithWallet.length > 0) {
        const userIds = usersWithWallet.map(u => u.id);
        conditions.push(sql`${transactions.userId} IN ${userIds}`);
      } else {
        // No users with this wallet, return empty result
        return NextResponse.json({
          transactions: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0
          }
        });
      }
    }

    if (tokenSymbol) {
      conditions.push(
        or(
          like(transactions.tokenIn, `%${tokenSymbol}%`),
          like(transactions.tokenOut, `%${tokenSymbol}%`)
        )
      );
    }

    if (startDateTime) {
      conditions.push(gte(transactions.timestamp, startDateTime.toISOString()));
    }

    if (endDateTime) {
      conditions.push(lte(transactions.timestamp, endDateTime.toISOString()));
    }

    if (search) {
      conditions.push(
        or(
          like(transactions.txHash, `%${search}%`),
          like(transactions.tokenIn, `%${search}%`),
          like(transactions.tokenOut, `%${search}%`)
        )
      );
    }

    const whereCondition = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalCountQuery = await db.select({ count: count() })
      .from(transactions)
      .where(whereCondition);

    const total = totalCountQuery[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Map sortBy to actual column names
    const sortFieldMap: { [key: string]: any } = {
      'timestamp': transactions.timestamp,
      'amountIn': transactions.amountIn,
      'amountOut': transactions.amountOut,
      'gasFee': transactions.gasFee
    };

    const sortField = sortFieldMap[sortBy];
    const orderFunction = sortOrder === 'asc' ? asc : desc;

    // Build the main query with joins
    let query = db.select({
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
      userId: transactions.userId,
      userEmail: users.email,
      userWalletAddress: users.walletAddress
    })
    .from(transactions)
    .leftJoin(users, eq(transactions.userId, users.id));

    if (whereCondition) {
      query = query.where(whereCondition);
    }

    const results = await query
      .orderBy(orderFunction(sortField))
      .limit(limit)
      .offset(offset);

    // Get user names by joining with user table on email
    const enrichedTransactions = await Promise.all(
      results.map(async (tx) => {
        let userName = null;
        
        if (tx.userEmail) {
          const userInfo = await db.select({ name: user.name })
            .from(user)
            .where(eq(user.email, tx.userEmail))
            .limit(1);
          
          if (userInfo.length > 0) {
            userName = userInfo[0].name;
          }
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
          user: {
            id: tx.userId,
            name: userName,
            email: tx.userEmail,
            walletAddress: tx.userWalletAddress
          }
        };
      })
    );

    return NextResponse.json({
      transactions: enrichedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('GET /api/admin/transactions-management error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
    }, { status: 500 });
  }
}