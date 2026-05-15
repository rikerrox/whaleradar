import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, getUserStats, generateSessionToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, walletAddress } = body;

    // Wallet-based login
    if (walletAddress && !email) {
      let user = await db.user.findUnique({
        where: { walletAddress },
        include: {
          wallets: true,
          subscriptions: {
            where: { status: 'active' },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!user) {
        return NextResponse.json(
          { error: 'No account found for this wallet. Please register first.' },
          { status: 404 }
        );
      }

      // Create session
      const sessionToken = generateSessionToken();
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.session.create({
        data: {
          sessionToken,
          userId: user.id,
          expires,
        },
      });

      const stats = await getUserStats(user.id);
      const { passwordHash: _, ...safeUser } = user;

      return NextResponse.json({
        data: { ...safeUser, stats },
        sessionToken,
        isNewUser: false,
      });
    }

    // Email/password login
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = generateSessionToken();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await db.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    });

    const stats = await getUserStats(user.id);
    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json({
      data: { ...safeUser, stats },
      sessionToken,
      isNewUser: false,
    });
  } catch (error) {
    console.error('Error logging in:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
