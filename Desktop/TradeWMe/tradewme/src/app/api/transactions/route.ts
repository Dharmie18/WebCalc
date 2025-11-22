import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { transactions, users, portfolios } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

const VALID_TYPES = ['swap', 'send', 'receive'] as const;
const VALID_STATUSES = ['pending', 'confirmed', 'failed'] as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const txHash = searchParams.get('txHash');
    const userId = searchParams.get('userId');
    const portfolioId = searchParams.get('portfolioId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single transaction by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const transaction = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, parseInt(id)))
        .limit(1);

      if (transaction.length === 0) {
        return NextResponse.json(
          { error: 'Transaction not found', code: 'TRANSACTION_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(transaction[0], { status: 200 });
    }

    // Single transaction by txHash
    if (txHash) {
      const transaction = await db
        .select()
        .from(transactions)
        .where(eq(transactions.txHash, txHash))
        .limit(1);

      if (transaction.length === 0) {
        return NextResponse.json(
          { error: 'Transaction not found', code: 'TRANSACTION_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(transaction[0], { status: 200 });
    }

    // List transactions with filters
    const conditions = [];

    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid userId is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(transactions.userId, parseInt(userId)));
    }

    if (portfolioId) {
      if (isNaN(parseInt(portfolioId))) {
        return NextResponse.json(
          { error: 'Valid portfolioId is required', code: 'INVALID_PORTFOLIO_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(transactions.portfolioId, parseInt(portfolioId)));
    }

    if (status) {
      if (!VALID_STATUSES.includes(status as any)) {
        return NextResponse.json(
          { 
            error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
            code: 'INVALID_STATUS' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(transactions.status, status));
    }

    if (type) {
      if (!VALID_TYPES.includes(type as any)) {
        return NextResponse.json(
          { 
            error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`, 
            code: 'INVALID_TYPE' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(transactions.type, type));
    }

    if (search) {
      const searchCondition = or(
        like(transactions.tokenIn, `%${search}%`),
        like(transactions.tokenOut, `%${search}%`)
      );
      conditions.push(searchCondition);
    }

    let query = db.select().from(transactions);

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(transactions.timestamp))
      .limit(limit)
      .offset(offset);

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
    const { 
      userId, 
      portfolioId, 
      txHash, 
      type, 
      timestamp,
      tokenIn,
      tokenOut,
      amountIn,
      amountOut,
      gasFee,
      status = 'pending'
    } = body;

    // Validate required fields
    if (!userId || !portfolioId || !txHash || !type || !timestamp) {
      return NextResponse.json(
        { 
          error: 'Missing required fields: userId, portfolioId, txHash, type, timestamp', 
          code: 'MISSING_REQUIRED_FIELDS' 
        },
        { status: 400 }
      );
    }

    // Validate userId is integer
    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'userId must be a valid integer', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validate portfolioId is integer
    if (isNaN(parseInt(portfolioId))) {
      return NextResponse.json(
        { error: 'portfolioId must be a valid integer', code: 'INVALID_PORTFOLIO_ID' },
        { status: 400 }
      );
    }

    // Validate type
    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { 
          error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}`, 
          code: 'INVALID_TYPE' 
        },
        { status: 400 }
      );
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Verify userId exists
    const userExists = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(userId)))
      .limit(1);

    if (userExists.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 400 }
      );
    }

    // Verify portfolioId exists
    const portfolioExists = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.id, parseInt(portfolioId)))
      .limit(1);

    if (portfolioExists.length === 0) {
      return NextResponse.json(
        { error: 'Portfolio not found', code: 'PORTFOLIO_NOT_FOUND' },
        { status: 400 }
      );
    }

    const newTransaction = await db
      .insert(transactions)
      .values({
        userId: parseInt(userId),
        portfolioId: parseInt(portfolioId),
        txHash: txHash.trim(),
        type,
        tokenIn: tokenIn?.trim() || null,
        tokenOut: tokenOut?.trim() || null,
        amountIn: amountIn ? parseFloat(amountIn) : null,
        amountOut: amountOut ? parseFloat(amountOut) : null,
        gasFee: gasFee ? parseFloat(gasFee) : null,
        status,
        timestamp,
        createdAt: new Date().toISOString(),
      })
      .returning();

    return NextResponse.json(newTransaction[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    
    // Check for unique constraint violation
    if ((error as Error).message.includes('UNIQUE')) {
      return NextResponse.json(
        { error: 'Transaction with this txHash already exists', code: 'DUPLICATE_TX_HASH' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status, tokenIn, tokenOut, amountIn, amountOut, gasFee } = body;

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`, 
          code: 'INVALID_STATUS' 
        },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const existing = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found', code: 'TRANSACTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updates: any = {};

    if (status !== undefined) updates.status = status;
    if (tokenIn !== undefined) updates.tokenIn = tokenIn?.trim() || null;
    if (tokenOut !== undefined) updates.tokenOut = tokenOut?.trim() || null;
    if (amountIn !== undefined) updates.amountIn = amountIn ? parseFloat(amountIn) : null;
    if (amountOut !== undefined) updates.amountOut = amountOut ? parseFloat(amountOut) : null;
    if (gasFee !== undefined) updates.gasFee = gasFee ? parseFloat(gasFee) : null;

    // If no fields to update, return current transaction
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(existing[0], { status: 200 });
    }

    const updated = await db
      .update(transactions)
      .set(updates)
      .where(eq(transactions.id, parseInt(id)))
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
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if transaction exists
    const existing = await db
      .select()
      .from(transactions)
      .where(eq(transactions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found', code: 'TRANSACTION_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(transactions)
      .where(eq(transactions.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Transaction deleted successfully',
        transaction: deleted[0],
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