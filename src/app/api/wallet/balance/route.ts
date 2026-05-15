import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSolPrice } from '@/lib/sol-price-server';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await db.session.findUnique({ where: { sessionToken } });
    if (!session || session.expires < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.userId },
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
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Calculate portfolio stats
    const [activeCopyTrades, totalPnl, solPrice] = await Promise.all([
      db.copyTrade.count({
        where: { userId: user.id, status: { in: ['pending', 'executed'] } },
      }),
      db.copyTrade.aggregate({
        where: { userId: user.id, status: 'executed', pnl: { not: null } },
        _sum: { pnl: true },
      }),
      getSolPrice(),
    ]);

    const portfolioValue = user.solBalance * solPrice + (totalPnl._sum.pnl || 0);

    return NextResponse.json({
      data: {
        solBalance: user.solBalance,
        walletAddress: user.walletAddress,
        portfolioValue,
        totalPnl: totalPnl._sum.pnl || 0,
        activeCopyTrades,
        plan: user.plan,
        subscription: user.subscriptions[0] || null,
      },
    });
  } catch (error) {
    console.error('Error fetching balance:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}
