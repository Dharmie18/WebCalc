import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { desc, count, sql } from 'drizzle-orm';

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

    // Fixed limit of 50 records per page
    const limit = 50;
    const offset = (page - 1) * limit;

    // Run both queries in parallel
    const [usersList, totalResult] = await Promise.all([
      // Get paginated users
      db.select({
        id: users.id,
        email: users.email,
        walletAddress: users.walletAddress,
        premiumTier: users.premiumTier,
        premiumExpiresAt: users.premiumExpiresAt,
        createdAt: users.createdAt,
      })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      
      // Get total count
      db.select({ count: count() })
        .from(users)
    ]);

    const total = totalResult[0].count;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      users: usersList,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET /api/admin/users error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error')
      },
      { status: 500 }
    );
  }
}