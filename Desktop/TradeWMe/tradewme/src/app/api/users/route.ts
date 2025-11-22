import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

const VALID_PREMIUM_TIERS = ['free', 'pro', 'enterprise'] as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const walletAddress = searchParams.get('walletAddress');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single user by ID
    if (id) {
      if (!id || isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const user = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(id)))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(user[0], { status: 200 });
    }

    // Single user by wallet address
    if (walletAddress) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.walletAddress, walletAddress))
        .limit(1);

      if (user.length === 0) {
        return NextResponse.json(
          { error: 'User not found', code: 'USER_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(user[0], { status: 200 });
    }

    // List users with optional search
    let query = db.select().from(users);

    if (search) {
      query = query.where(like(users.email, `%${search}%`));
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
    const { email, walletAddress, premiumTier } = body;

    // Validation: email is required
    if (!email || typeof email !== 'string' || email.trim() === '') {
      return NextResponse.json(
        {
          error: 'Email is required and must be a non-empty string',
          code: 'MISSING_REQUIRED_FIELDS',
        },
        { status: 400 }
      );
    }

    // Validation: premiumTier must be valid if provided
    if (premiumTier && !VALID_PREMIUM_TIERS.includes(premiumTier)) {
      return NextResponse.json(
        {
          error: `Premium tier must be one of: ${VALID_PREMIUM_TIERS.join(', ')}`,
          code: 'INVALID_PREMIUM_TIER',
        },
        { status: 400 }
      );
    }

    // Prepare insert data
    const now = new Date().toISOString();
    const insertData: {
      email: string;
      walletAddress?: string;
      premiumTier: string;
      createdAt: string;
      updatedAt: string;
    } = {
      email: email.trim().toLowerCase(),
      premiumTier: premiumTier || 'free',
      createdAt: now,
      updatedAt: now,
    };

    if (walletAddress) {
      insertData.walletAddress = walletAddress;
    }

    const newUser = await db.insert(users).values(insertData).returning();

    return NextResponse.json(newUser[0], { status: 201 });
  } catch (error) {
    console.error('POST error:', error);
    
    // Handle unique constraint violations
    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      if ((error as Error).message.includes('email')) {
        return NextResponse.json(
          { error: 'Email already exists', code: 'EMAIL_EXISTS' },
          { status: 400 }
        );
      }
      if ((error as Error).message.includes('wallet_address')) {
        return NextResponse.json(
          { error: 'Wallet address already exists', code: 'WALLET_ADDRESS_EXISTS' },
          { status: 400 }
        );
      }
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

    // Validation: ID is required and must be valid
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, walletAddress, premiumTier, premiumExpiresAt } = body;

    // Validation: premiumTier must be valid if provided
    if (premiumTier && !VALID_PREMIUM_TIERS.includes(premiumTier)) {
      return NextResponse.json(
        {
          error: `Premium tier must be one of: ${VALID_PREMIUM_TIERS.join(', ')}`,
          code: 'INVALID_PREMIUM_TIER',
        },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: {
      email?: string;
      walletAddress?: string | null;
      premiumTier?: string;
      premiumExpiresAt?: string | null;
      updatedAt: string;
    } = {
      updatedAt: new Date().toISOString(),
    };

    if (email !== undefined) {
      updateData.email = email.trim().toLowerCase();
    }

    if (walletAddress !== undefined) {
      updateData.walletAddress = walletAddress || null;
    }

    if (premiumTier !== undefined) {
      updateData.premiumTier = premiumTier;
    }

    if (premiumExpiresAt !== undefined) {
      updateData.premiumExpiresAt = premiumExpiresAt || null;
    }

    const updatedUser = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, parseInt(id)))
      .returning();

    return NextResponse.json(updatedUser[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);

    // Handle unique constraint violations
    if ((error as Error).message.includes('UNIQUE constraint failed')) {
      if ((error as Error).message.includes('email')) {
        return NextResponse.json(
          { error: 'Email already exists', code: 'EMAIL_EXISTS' },
          { status: 400 }
        );
      }
      if ((error as Error).message.includes('wallet_address')) {
        return NextResponse.json(
          { error: 'Wallet address already exists', code: 'WALLET_ADDRESS_EXISTS' },
          { status: 400 }
        );
      }
    }

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

    // Validation: ID is required and must be valid
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, parseInt(id)))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', code: 'USER_NOT_FOUND' },
        { status: 404 }
      );
    }

    const deletedUser = await db
      .delete(users)
      .where(eq(users.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'User deleted successfully',
        user: deletedUser[0],
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