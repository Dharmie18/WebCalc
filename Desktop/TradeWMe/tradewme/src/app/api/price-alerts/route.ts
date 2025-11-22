import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { priceAlerts } from '@/db/schema';
import { eq, like, and, or } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Single record fetch
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const alert = await db
        .select()
        .from(priceAlerts)
        .where(eq(priceAlerts.id, parseInt(id)))
        .limit(1);

      if (alert.length === 0) {
        return NextResponse.json(
          { error: 'Price alert not found', code: 'ALERT_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(alert[0], { status: 200 });
    }

    // List with filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');
    const triggered = searchParams.get('triggered');
    const notified = searchParams.get('notified');

    let query = db.select().from(priceAlerts);

    // Build filter conditions
    const conditions = [];

    if (search) {
      conditions.push(like(priceAlerts.tokenSymbol, `%${search}%`));
    }

    if (userId) {
      const userIdNum = parseInt(userId);
      if (!isNaN(userIdNum)) {
        conditions.push(eq(priceAlerts.userId, userIdNum));
      }
    }

    if (triggered !== null) {
      if (triggered === 'true') {
        conditions.push(eq(priceAlerts.triggered, true));
      } else if (triggered === 'false') {
        conditions.push(eq(priceAlerts.triggered, false));
      }
    }

    if (notified !== null) {
      if (notified === 'true') {
        conditions.push(eq(priceAlerts.notified, true));
      } else if (notified === 'false') {
        conditions.push(eq(priceAlerts.notified, false));
      }
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
    const { userId, tokenSymbol, tokenAddress, condition, targetPrice, currentPrice } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    if (!tokenSymbol) {
      return NextResponse.json(
        { error: 'tokenSymbol is required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    if (!tokenAddress) {
      return NextResponse.json(
        { error: 'tokenAddress is required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    if (!condition) {
      return NextResponse.json(
        { error: 'condition is required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    if (targetPrice === undefined || targetPrice === null) {
      return NextResponse.json(
        { error: 'targetPrice is required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    // Validate condition value
    if (condition !== 'above' && condition !== 'below') {
      return NextResponse.json(
        { error: 'condition must be either "above" or "below"', code: 'INVALID_CONDITION' },
        { status: 400 }
      );
    }

    // Validate targetPrice
    const targetPriceNum = parseFloat(targetPrice);
    if (isNaN(targetPriceNum) || targetPriceNum <= 0) {
      return NextResponse.json(
        { error: 'targetPrice must be a valid number greater than 0', code: 'INVALID_PRICE' },
        { status: 400 }
      );
    }

    // Validate currentPrice if provided
    let currentPriceNum = null;
    if (currentPrice !== undefined && currentPrice !== null) {
      currentPriceNum = parseFloat(currentPrice);
      if (isNaN(currentPriceNum)) {
        return NextResponse.json(
          { error: 'currentPrice must be a valid number', code: 'INVALID_PRICE' },
          { status: 400 }
        );
      }
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData = {
      userId: parseInt(userId),
      tokenSymbol: tokenSymbol.trim(),
      tokenAddress: tokenAddress.trim(),
      condition,
      targetPrice: targetPriceNum,
      currentPrice: currentPriceNum,
      triggered: false,
      notified: false,
      createdAt: now,
      updatedAt: now,
    };

    const newAlert = await db.insert(priceAlerts).values(insertData).returning();

    return NextResponse.json(newAlert[0], { status: 201 });
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const alertId = parseInt(id);

    // Check if alert exists
    const existingAlert = await db
      .select()
      .from(priceAlerts)
      .where(eq(priceAlerts.id, alertId))
      .limit(1);

    if (existingAlert.length === 0) {
      return NextResponse.json(
        { error: 'Price alert not found', code: 'ALERT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updates: any = {};

    // Handle updatable fields with validation
    if (body.tokenSymbol !== undefined) {
      updates.tokenSymbol = body.tokenSymbol.trim();
    }

    if (body.tokenAddress !== undefined) {
      updates.tokenAddress = body.tokenAddress.trim();
    }

    if (body.condition !== undefined) {
      if (body.condition !== 'above' && body.condition !== 'below') {
        return NextResponse.json(
          { error: 'condition must be either "above" or "below"', code: 'INVALID_CONDITION' },
          { status: 400 }
        );
      }
      updates.condition = body.condition;
    }

    if (body.targetPrice !== undefined) {
      const targetPriceNum = parseFloat(body.targetPrice);
      if (isNaN(targetPriceNum) || targetPriceNum <= 0) {
        return NextResponse.json(
          { error: 'targetPrice must be a valid number greater than 0', code: 'INVALID_PRICE' },
          { status: 400 }
        );
      }
      updates.targetPrice = targetPriceNum;
    }

    if (body.currentPrice !== undefined) {
      if (body.currentPrice === null) {
        updates.currentPrice = null;
      } else {
        const currentPriceNum = parseFloat(body.currentPrice);
        if (isNaN(currentPriceNum)) {
          return NextResponse.json(
            { error: 'currentPrice must be a valid number', code: 'INVALID_PRICE' },
            { status: 400 }
          );
        }
        updates.currentPrice = currentPriceNum;
      }
    }

    if (body.triggered !== undefined) {
      updates.triggered = Boolean(body.triggered);
    }

    if (body.notified !== undefined) {
      updates.notified = Boolean(body.notified);
    }

    // Always update updatedAt
    updates.updatedAt = new Date().toISOString();

    const updated = await db
      .update(priceAlerts)
      .set(updates)
      .where(eq(priceAlerts.id, alertId))
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

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const alertId = parseInt(id);

    // Check if alert exists
    const existingAlert = await db
      .select()
      .from(priceAlerts)
      .where(eq(priceAlerts.id, alertId))
      .limit(1);

    if (existingAlert.length === 0) {
      return NextResponse.json(
        { error: 'Price alert not found', code: 'ALERT_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deleted = await db
      .delete(priceAlerts)
      .where(eq(priceAlerts.id, alertId))
      .returning();

    return NextResponse.json(
      {
        message: 'Price alert deleted successfully',
        alert: deleted[0],
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