import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, session, users, transactions } from '@/db/schema';
import { eq, like, and, or, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authHeader = request.headers.get('authorization');
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
        error: 'Session has expired',
        code: 'EXPIRED_SESSION' 
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

    // Check admin role - better-auth stores role in a separate column
    // Since the schema doesn't show a role column in user table, we need to add it or check differently
    // For now, we'll check if a role field exists in the user record
    const userRole = (currentUser as any).role;
    
    if (!userRole || userRole !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));
    const roleFilter = searchParams.get('role');
    const premiumTierFilter = searchParams.get('premiumTier');
    const search = searchParams.get('search');

    // Validate role filter
    if (roleFilter && !['user', 'admin'].includes(roleFilter)) {
      return NextResponse.json({ 
        error: 'Invalid role filter. Must be "user" or "admin"',
        code: 'INVALID_ROLE_FILTER' 
      }, { status: 400 });
    }

    // Validate premium tier filter
    if (premiumTierFilter && !['free', 'pro', 'enterprise'].includes(premiumTierFilter)) {
      return NextResponse.json({ 
        error: 'Invalid premium tier filter. Must be "free", "pro", or "enterprise"',
        code: 'INVALID_PREMIUM_TIER_FILTER' 
      }, { status: 400 });
    }

    const offset = (page - 1) * limit;

    // Build the query with aggregations
    // We need to join user table with users table on email, then LEFT JOIN transactions
    const transactionCount = sql<number>`COALESCE(COUNT(DISTINCT ${transactions.id}), 0)`.as('transactionCount');
    const totalVolume = sql<number>`COALESCE(SUM(${transactions.amountOut}), 0)`.as('totalVolume');

    // Build WHERE conditions
    const conditions = [];

    // Role filter
    if (roleFilter) {
      conditions.push(sql`${user.role} = ${roleFilter}`);
    }

    // Premium tier filter
    if (premiumTierFilter) {
      conditions.push(eq(users.premiumTier, premiumTierFilter));
    }

    // Search filter
    if (search) {
      const searchPattern = `%${search}%`;
      conditions.push(
        or(
          like(user.email, searchPattern),
          like(users.walletAddress, searchPattern)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const countQuery = db.select({
      count: sql<number>`COUNT(DISTINCT ${user.id})`.as('count')
    })
      .from(user)
      .leftJoin(users, eq(user.email, users.email));

    if (whereClause) {
      countQuery.where(whereClause);
    }

    const totalResult = await countQuery;
    const total = totalResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Main query with aggregations
    const query = db.select({
      id: user.id,
      name: user.name,
      email: user.email,
      walletAddress: users.walletAddress,
      role: sql<string>`${user.role}`.as('role'),
      premiumTier: users.premiumTier,
      createdAt: user.createdAt,
      transactionCount,
      totalVolume
    })
      .from(user)
      .leftJoin(users, eq(user.email, users.email))
      .leftJoin(transactions, eq(users.id, transactions.userId))
      .groupBy(user.id, user.name, user.email, users.walletAddress, user.role, users.premiumTier, user.createdAt)
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      query.where(whereClause);
    }

    const results = await query;

    // Format results
    const formattedUsers = results.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      walletAddress: row.walletAddress ?? null,
      role: row.role ?? 'user',
      premiumTier: row.premiumTier ?? 'free',
      createdAt: row.createdAt instanceof Date 
        ? row.createdAt.toISOString() 
        : new Date(row.createdAt).toISOString(),
      transactionCount: row.transactionCount ?? 0,
      totalVolume: row.totalVolume ?? 0
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET /api/admin/users/list error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}