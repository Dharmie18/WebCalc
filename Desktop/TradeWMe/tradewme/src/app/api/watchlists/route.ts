import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { watchlists } from '@/db/schema';
import { eq, like, and, or, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('userId');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single watchlist by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const watchlist = await db
        .select()
        .from(watchlists)
        .where(eq(watchlists.id, parseInt(id)))
        .limit(1);

      if (watchlist.length === 0) {
        return NextResponse.json(
          { error: 'Watchlist not found', code: 'WATCHLIST_NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(watchlist[0], { status: 200 });
    }

    // List watchlists with filters
    let query = db.select().from(watchlists);

    const conditions = [];

    // Filter by userId
    if (userId) {
      if (isNaN(parseInt(userId))) {
        return NextResponse.json(
          { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
          { status: 400 }
        );
      }
      conditions.push(eq(watchlists.userId, parseInt(userId)));
    }

    // Search by name
    if (search) {
      conditions.push(like(watchlists.name, `%${search}%`));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query
      .orderBy(desc(watchlists.createdAt))
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
    const { userId, name, tokens } = body;

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    if (!tokens) {
      return NextResponse.json(
        { error: 'Tokens are required', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    // Validate userId is a valid integer
    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { error: 'Valid user ID is required', code: 'INVALID_USER_ID' },
        { status: 400 }
      );
    }

    // Validate tokens is a valid array
    if (!Array.isArray(tokens)) {
      return NextResponse.json(
        { error: 'Tokens must be a valid JSON array', code: 'INVALID_JSON' },
        { status: 400 }
      );
    }

    // Sanitize inputs
    const sanitizedName = name.trim();

    if (!sanitizedName) {
      return NextResponse.json(
        { error: 'Name cannot be empty', code: 'MISSING_REQUIRED_FIELDS' },
        { status: 400 }
      );
    }

    // Create watchlist
    const now = new Date().toISOString();
    const newWatchlist = await db
      .insert(watchlists)
      .values({
        userId: parseInt(userId),
        name: sanitizedName,
        tokens: tokens,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    return NextResponse.json(newWatchlist[0], { status: 201 });
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

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, tokens } = body;

    // Check if watchlist exists
    const existing = await db
      .select()
      .from(watchlists)
      .where(eq(watchlists.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Watchlist not found', code: 'WATCHLIST_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updates: any = {
      updatedAt: new Date().toISOString(),
    };

    // Validate and add name if provided
    if (name !== undefined) {
      const sanitizedName = name.trim();
      if (!sanitizedName) {
        return NextResponse.json(
          { error: 'Name cannot be empty', code: 'MISSING_REQUIRED_FIELDS' },
          { status: 400 }
        );
      }
      updates.name = sanitizedName;
    }

    // Validate and add tokens if provided
    if (tokens !== undefined) {
      if (!Array.isArray(tokens)) {
        return NextResponse.json(
          { error: 'Tokens must be a valid JSON array', code: 'INVALID_JSON' },
          { status: 400 }
        );
      }
      updates.tokens = tokens;
    }

    // Update watchlist
    const updated = await db
      .update(watchlists)
      .set(updates)
      .where(eq(watchlists.id, parseInt(id)))
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

    // Validate ID parameter
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if watchlist exists
    const existing = await db
      .select()
      .from(watchlists)
      .where(eq(watchlists.id, parseInt(id)))
      .limit(1);

    if (existing.length === 0) {
      return NextResponse.json(
        { error: 'Watchlist not found', code: 'WATCHLIST_NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete watchlist
    const deleted = await db
      .delete(watchlists)
      .where(eq(watchlists.id, parseInt(id)))
      .returning();

    return NextResponse.json(
      {
        message: 'Watchlist deleted successfully',
        watchlist: deleted[0],
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