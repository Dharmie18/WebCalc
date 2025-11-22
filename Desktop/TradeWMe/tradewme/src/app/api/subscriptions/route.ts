import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { subscriptions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

const VALID_PLANS = ['pro', 'enterprise'];
const VALID_STATUSES = ['active', 'cancelled', 'past_due'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const stripeCustomerId = searchParams.get('stripeCustomerId');
    const stripeSubscriptionId = searchParams.get('stripeSubscriptionId');
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const plan = searchParams.get('plan');

    // Single subscription by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json({
          error: 'Valid ID is required',
          code: 'INVALID_ID'
        }, { status: 400 });
      }

      const subscription = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.id, parseInt(id)))
        .limit(1);

      if (subscription.length === 0) {
        return NextResponse.json({
          error: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(subscription[0]);
    }

    // Lookup by stripeCustomerId
    if (stripeCustomerId) {
      const subscription = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeCustomerId, stripeCustomerId))
        .limit(1);

      if (subscription.length === 0) {
        return NextResponse.json({
          error: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(subscription[0]);
    }

    // Lookup by stripeSubscriptionId
    if (stripeSubscriptionId) {
      const subscription = await db.select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
        .limit(1);

      if (subscription.length === 0) {
        return NextResponse.json({
          error: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        }, { status: 404 });
      }

      return NextResponse.json(subscription[0]);
    }

    // List with filters and pagination
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    let query = db.select().from(subscriptions);

    // Build filter conditions
    const conditions = [];
    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json({
          error: 'Valid userId is required',
          code: 'INVALID_USER_ID'
        }, { status: 400 });
      }
      conditions.push(eq(subscriptions.userId, parseInt(userId)));
    }
    if (status) {
      conditions.push(eq(subscriptions.status, status));
    }
    if (plan) {
      conditions.push(eq(subscriptions.plan, plan));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.limit(limit).offset(offset);

    return NextResponse.json(results);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      stripeCustomerId,
      stripeSubscriptionId,
      plan,
      status = 'active',
      currentPeriodEnd
    } = body;

    // Validate required fields
    if (!userId || !stripeCustomerId || !stripeSubscriptionId || !plan || !currentPeriodEnd) {
      return NextResponse.json({
        error: 'Missing required fields: userId, stripeCustomerId, stripeSubscriptionId, plan, currentPeriodEnd',
        code: 'MISSING_REQUIRED_FIELDS'
      }, { status: 400 });
    }

    // Validate userId - handle both number and string inputs
    const userIdNum = typeof userId === 'string' ? parseInt(userId) : userId;
    if (typeof userIdNum !== 'number' || isNaN(userIdNum)) {
      return NextResponse.json({
        error: 'userId must be a valid integer',
        code: 'INVALID_USER_ID'
      }, { status: 400 });
    }

    // Validate plan
    if (!VALID_PLANS.includes(plan)) {
      return NextResponse.json({
        error: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ')}`,
        code: 'INVALID_PLAN'
      }, { status: 400 });
    }

    // Validate status
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    const now = new Date().toISOString();

    const newSubscription = await db.insert(subscriptions)
      .values({
        userId: userIdNum,
        stripeCustomerId,
        stripeSubscriptionId,
        plan,
        status,
        currentPeriodEnd,
        createdAt: now,
        updatedAt: now
      })
      .returning();

    return NextResponse.json(newSubscription[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { plan, status, currentPeriodEnd } = body;

    // Validate plan if provided
    if (plan && !VALID_PLANS.includes(plan)) {
      return NextResponse.json({
        error: `Invalid plan. Must be one of: ${VALID_PLANS.join(', ')}`,
        code: 'INVALID_PLAN'
      }, { status: 400 });
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
        code: 'INVALID_STATUS'
      }, { status: 400 });
    }

    // Check if subscription exists
    const existing = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({
        error: 'Subscription not found',
        code: 'SUBSCRIPTION_NOT_FOUND'
      }, { status: 404 });
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    if (plan !== undefined) updates.plan = plan;
    if (status !== undefined) updates.status = status;
    if (currentPeriodEnd !== undefined) updates.currentPeriodEnd = currentPeriodEnd;

    const updated = await db.update(subscriptions)
      .set(updates)
      .where(eq(subscriptions.id, parseInt(id)))
      .returning();

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({
        error: 'Valid ID is required',
        code: 'INVALID_ID'
      }, { status: 400 });
    }

    // Check if subscription exists
    const existing = await db.select()
      .from(subscriptions)
      .where(eq(subscriptions.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json({
        error: 'Subscription not found',
        code: 'SUBSCRIPTION_NOT_FOUND'
      }, { status: 404 });
    }

    const deleted = await db.delete(subscriptions)
      .where(eq(subscriptions.id, parseInt(id)))
      .returning();

    return NextResponse.json({
      message: 'Subscription deleted successfully',
      subscription: deleted[0]
    });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}