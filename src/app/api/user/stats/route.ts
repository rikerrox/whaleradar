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

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get comprehensive stats
    const [
      totalCopyTrades,
      executedCopyTrades,
      activeCopyTrades,
      totalPnlResult,
      todayPnlResult,
      totalDeposits,
      totalWithdrawals,
      unreadAlerts,
      watchlistCount,
      subscription,
    ] = await Promise.all([
      db.copyTrade.count({ where: { userId: user.id } }),
      db.copyTrade.count({ where: { userId: user.id, status: 'executed' } }),
      db.copyTrade.count({ where: { userId: user.id, status: { in: ['pending', 'executed'] } } }),
      db.copyTrade.aggregate({
        where: { userId: user.id, status: 'executed', pnl: { not: null } },
        _sum: { pnl: true },
        _avg: { pnl: true },
      }),
      db.copyTrade.aggregate({
        where: {
          userId: user.id,
          status: 'executed',
          pnl: { not: null },
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
        _sum: { pnl: true },
      }),
      db.transaction.aggregate({
        where: { userId: user.id, type: 'deposit', status: 'completed' },
        _sum: { amount: true },
      }),
      db.transaction.aggregate({
        where: { userId: user.id, type: 'withdrawal', status: 'completed' },
        _sum: { amount: true },
      }),
      db.alert.count({ where: { userId: user.id, isRead: false } }),
      db.watchlist.count({ where: { userId: user.id } }),
      db.subscription.findFirst({
        where: { userId: user.id, status: 'active' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Calculate win rate
    const winningTrades = await db.copyTrade.count({
      where: { userId: user.id, status: 'executed', pnl: { gt: 0 } },
    });
    const winRate = executedCopyTrades > 0 ? (winningTrades / executedCopyTrades) * 100 : 0;

    const solPrice = 142.58;
    const totalPnl = totalPnlResult._sum.pnl || 0;
    const todayPnl = todayPnlResult._sum.pnl || 0;
    const portfolioValue = user.solBalance * solPrice + totalPnl;
    const totalDeposited = totalDeposits._sum.amount || 0;

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          walletAddress: user.walletAddress,
          plan: user.plan,
          solBalance: user.solBalance,
          createdAt: user.createdAt,
        },
        portfolio: {
          totalValue: portfolioValue,
          totalPnl,
          totalPnlPercent: totalDeposited > 0 ? (totalPnl / (totalDeposited * solPrice)) * 100 : 0,
          solBalance: user.solBalance,
          activePositions: activeCopyTrades,
          activeCopyTrades,
          todayPnl,
          todayPnlPercent: portfolioValue > 0 ? (todayPnl / portfolioValue) * 100 : 0,
        },
        trading: {
          totalCopyTrades,
          executedCopyTrades,
          activeCopyTrades,
          winRate,
          avgPnlPerTrade: totalPnlResult._avg.pnl || 0,
        },
        financial: {
          totalDeposited,
          totalWithdrawals: totalWithdrawals._sum.amount || 0,
          netPnl: totalPnl,
        },
        notifications: {
          unreadAlerts,
          watchlistCount,
        },
        subscription,
      },
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
