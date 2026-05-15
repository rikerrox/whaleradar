import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getUserStats } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = await db.session.findUnique({
      where: { sessionToken },
      include: {
        user: {
          include: {
            wallets: true,
            subscriptions: {
              where: { status: 'active' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!session || session.expires < new Date()) {
      return NextResponse.json(
        { error: 'Session expired' },
        { status: 401 }
      );
    }

    const { passwordHash: _, ...safeUser } = session.user;
    const stats = await getUserStats(session.user.id);

    return NextResponse.json({
      data: { ...safeUser, stats },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}
