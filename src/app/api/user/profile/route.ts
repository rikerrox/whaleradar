import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

    const userId = session.userId;

    // Fetch user (strip passwordHash)
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        wallets: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Fetch all related data in parallel
    const [
      activeSubscription,
      recentTransactions,
      activeCopyTrades,
      watchlistCount,
      alertCount,
      unreadAlertCount,
      totalCopyTrades,
      executedCopyTrades,
      totalPnlResult,
      totalDeposits,
      totalWithdrawals,
    ] = await Promise.all([
      // Active subscription
      db.subscription.findFirst({
        where: { userId, status: 'active' },
        orderBy: { createdAt: 'desc' },
      }),
      // Recent transactions (last 10)
      db.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      // Active copy trades (pending or executed)
      db.copyTrade.findMany({
        where: { userId, status: { in: ['pending', 'executed'] } },
        orderBy: { createdAt: 'desc' },
      }),
      // Watchlist count
      db.watchlist.count({ where: { userId } }),
      // Total alert count
      db.alert.count({ where: { userId } }),
      // Unread alert count
      db.alert.count({ where: { userId, isRead: false } }),
      // Total copy trades
      db.copyTrade.count({ where: { userId } }),
      // Executed copy trades
      db.copyTrade.count({ where: { userId, status: 'executed' } }),
      // Total PnL
      db.copyTrade.aggregate({
        where: { userId, status: 'executed', pnl: { not: null } },
        _sum: { pnl: true },
        _avg: { pnl: true },
      }),
      // Total deposits
      db.transaction.aggregate({
        where: { userId, type: 'deposit', status: 'completed' },
        _sum: { amount: true },
      }),
      // Total withdrawals
      db.transaction.aggregate({
        where: { userId, type: 'withdrawal', status: 'completed' },
        _sum: { amount: true },
      }),
    ]);

    // Calculate win rate
    const winningTrades = await db.copyTrade.count({
      where: { userId, status: 'executed', pnl: { gt: 0 } },
    });
    const winRate = executedCopyTrades > 0 ? (winningTrades / executedCopyTrades) * 100 : 0;

    // Strip passwordHash from user
    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json({
      data: {
        user: safeUser,
        wallets: user.wallets,
        subscription: activeSubscription,
        recentTransactions,
        activeCopyTrades,
        stats: {
          watchlistCount,
          alertCount,
          unreadAlertCount,
          totalCopyTrades,
          executedCopyTrades,
          activeCopyTrades: activeCopyTrades.length,
          winRate: Math.round(winRate * 100) / 100,
          totalPnl: totalPnlResult._sum.pnl || 0,
          avgPnlPerTrade: totalPnlResult._avg.pnl || 0,
          totalDeposited: totalDeposits._sum.amount || 0,
          totalWithdrawn: totalWithdrawals._sum.amount || 0,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}
