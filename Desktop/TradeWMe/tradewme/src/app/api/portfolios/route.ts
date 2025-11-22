import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { portfolios } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const walletAddress = searchParams.get('walletAddress');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single portfolio by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const portfolio = await db
        .select()
        .from(portfolios)
        .where(eq(portfolios.id, parseInt(id)))
        .limit(1);

      if (portfolio.length === 0) {
        return NextResponse.json(
          { error: 'Portfolio not found', code: 'PORTFOLIO_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(portfolio[0], { status: 200 });
    }

    // List portfolios with optional filters
    let query = db.select().from(portfolios);

    const conditions = [];

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(portfolios.userId, parseInt(userId)));
    }

    if (walletAddress) {
      conditions.push(eq(portfolios.walletAddress, walletAddress));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, walletAddress, tokens, totalValueUsd, lastSyncedAt } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'walletAddress is required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    if (!tokens) {
      return NextResponse.json(
        { error: 'tokens is required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    // Validate userId is a valid integer
    if (isNaN(parseInt(String(userId)))) {
      return NextResponse.json(
        { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validate tokens is a valid JSON array
    let parsedTokens;
    try {
      if (typeof tokens === 'string') {
        parsedTokens = JSON.parse(tokens);
      } else {
        parsedTokens = tokens;
      }

      if (!Array.isArray(parsedTokens)) {
        return NextResponse.json(
          { error: 'tokens must be a JSON array', code: 'INVALID_JSON' },
          { status: 400 }
        );
      }
    } catch (e) {
      return NextResponse.json(
        { error: 'tokens must be valid JSON', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    const insertData: any = {
      userId: parseInt(String(userId)),
      walletAddress: walletAddress.trim(),
      tokens: JSON.stringify(parsedTokens),
      createdAt: now,
      updatedAt: now,
    };

    if (totalValueUsd !== undefined && totalValueUsd !== null) {
      insertData.totalValueUsd = parseFloat(String(totalValueUsd));
    }

    if (lastSyncedAt) {
      insertData.lastSyncedAt = lastSyncedAt;
    }

    const newPortfolio = await db.insert(portfolios).values(insertData).returning();

    return NextResponse.json(newPortfolio[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { walletAddress, tokens, totalValueUsd, lastSyncedAt } = body;

    // Check if portfolio exists
    const existing = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Portfolio not found', code: 'PORTFOLIO_NOT_FOUND' },
        { status: 404 }
      );
    }

    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    if (walletAddress !== undefined) {
      updates.walletAddress = walletAddress.trim();
    }

    if (tokens !== undefined) {
      // Validate tokens is a valid JSON array
      let parsedTokens;
      try {
        if (typeof tokens === 'string') {
          parsedTokens = JSON.parse(tokens);
        } else {
          parsedTokens = tokens;
        }

        if (!Array.isArray(parsedTokens)) {
          return NextResponse.json(
            { error: 'tokens must be a JSON array', code: 'INVALID_JSON' },
            { status: 400 }
          );
        }

        updates.tokens = parsedTokens;
      } catch (e) {
        return NextResponse.json(
          { error: 'tokens must be valid JSON', code: 'INVALID_JSON' },
          { status: 400 }
        );
      }
    }

    if (totalValueUsd !== undefined) {
      updates.totalValueUsd = totalValueUsd !== null ? parseFloat(String(totalValueUsd)) : null;
    }

    if (lastSyncedAt !== undefined) {
      updates.lastSyncedAt = lastSyncedAt;
    }

    const updated = await db
      .update(portfolios)
      .set(updates)
      .where(eq(portfolios.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if portfolio exists
    const existing = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Portfolio not found', code: 'PORTFOLIO_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(portfolios)
      .where(eq(portfolios.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Portfolio deleted successfully',
        portfolio: deleted[0],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}