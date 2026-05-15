import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createUserWithEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, username, password, walletAddress } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Check if wallet address already in use
    if (walletAddress) {
      const existingWallet = await db.user.findUnique({ where: { walletAddress } });
      if (existingWallet) {
        return NextResponse.json(
          { error: 'This wallet is already linked to another account' },
          { status: 409 }
        );
      }
    }

    // Create user
    const user = await createUserWithEmail(email, username || email.split('@')[0], password);

    // If wallet address provided, link it
    if (walletAddress) {
      await db.user.update({
        where: { id: user.id },
        data: { walletAddress },
      });
      await db.wallet.create({
        data: {
          userId: user.id,
          address: walletAddress,
          isWhale: false,
        },
      });
    }

    // Create a session token
    const sessionToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await db.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    });

    // Get user stats
    const stats = {
      unreadAlerts: 0,
      activeCopyTrades: 0,
      watchlistCount: 0,
      subscription: user.subscriptions[0] || null,
    };

    // Return user data (without password)
    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json({
      data: {
        ...safeUser,
        stats,
      },
      sessionToken,
      isNewUser: true,
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
