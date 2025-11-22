import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { user, users, transactions, session } from '@/db/schema';
import { eq, like, and, or, sql, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Authentication: Check Authorization header for session token
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ 
        error: 'Authentication token required',
        code: 'MISSING_AUTH_TOKEN' 
      }, { status: 401 });
    }

    const token = authHeader.substring(7);

    // Verify session token
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

    // Check if session is expired
    const currentSession = sessionRecord[0];
    if (new Date(currentSession.expiresAt) < new Date()) {
      return NextResponse.json({ 
        error: 'Session has expired',
        code: 'SESSION_EXPIRED' 
      }, { status: 401 });
    }

    // Get user from session
    const userRecord = await db.select()
      .from(user)
      .where(eq(user.id, currentSession.userId))
      .limit(1);

    if (userRecord.length === 0) {
      return NextResponse.json({ 
        error: 'User not found',
        code: 'USER_NOT_FOUND' 
      }, { status: 401 });
    }

    // Verify user is admin
    const currentUser = userRecord[0];
    if (currentUser.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required',
        code: 'FORBIDDEN' 
      }, { status: 403 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50')));
    const roleFilter = searchParams.get('role');
    const premiumTierFilter = searchParams.get('premiumTier');
    const searchQuery = searchParams.get('search');

    // Validate role filter
    if (roleFilter && !['user', 'admin'].includes(roleFilter)) {
      return NextResponse.json({ 
        error: 'Invalid role filter. Must be "user" or "admin"',
        code: 'INVALID_ROLE_FILTER' 
      }, { status: 400 });
    }

    // Validate premiumTier filter
    if (premiumTierFilter && !['free', 'pro', 'enterprise'].includes(premiumTierFilter)) {
      return NextResponse.json({ 
        error: 'Invalid premiumTier filter. Must be "free", "pro", or "enterprise"',
        code: 'INVALID_PREMIUM_TIER_FILTER' 
      }, { status: 400 });
    }

    // Calculate offset
    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [];

    if (roleFilter) {
      conditions.push(eq(user.role, roleFilter));
    }

    if (premiumTierFilter) {
      conditions.push(eq(users.premiumTier, premiumTierFilter));
    }

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      conditions.push(
        or(
          like(sql`LOWER(${user.email})`, `%${searchLower}%`),
          like(sql`LOWER(${users.walletAddress})`, `%${searchLower}%`)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count for pagination
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(user)
      .leftJoin(users, eq(user.email, users.email));

    if (whereClause) {
      countQuery.where(whereClause);
    }

    const totalResult = await countQuery;
    const total = totalResult[0]?.count ?? 0;
    const totalPages = Math.ceil(total / limit);

    // Build main query with aggregations
    const query = db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        walletAddress: users.walletAddress,
        role: user.role,
        premiumTier: users.premiumTier,
        createdAt: user.createdAt,
        transactionCount: sql<number>`COALESCE(COUNT(${transactions.id}), 0)`,
        totalVolume: sql<number>`COALESCE(SUM(${transactions.amountOut}), 0)`,
      })
      .from(user)
      .leftJoin(users, eq(user.email, users.email))
      .leftJoin(transactions, eq(users.id, transactions.userId))
      .groupBy(
        user.id,
        user.name,
        user.email,
        users.walletAddress,
        user.role,
        users.premiumTier,
        user.createdAt
      )
      .orderBy(desc(user.createdAt))
      .limit(limit)
      .offset(offset);

    if (whereClause) {
      query.where(whereClause);
    }

    const results = await query;

    // Format results
    const formattedUsers = results.map(result => ({
      id: result.id,
      name: result.name,
      email: result.email,
      walletAddress: result.walletAddress ?? null,
      role: result.role,
      premiumTier: result.premiumTier ?? 'free',
      createdAt: result.createdAt instanceof Date 
        ? result.createdAt.toISOString() 
        : new Date(result.createdAt).toISOString(),
      transactionCount: Number(result.transactionCount),
      totalVolume: Number(result.totalVolume),
    }));

    return NextResponse.json({
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    }, { status: 200 });

  } catch (error) {
    console.error('GET /api/admin/users-management error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      code: 'INTERNAL_SERVER_ERROR'
    }, { status: 500 });
  }
}