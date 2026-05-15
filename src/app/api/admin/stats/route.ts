import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');

    // In demo mode or when no session token, still return mock stats
    if (sessionToken) {
      try {
        const session = await db.session.findUnique({
          where: { sessionToken },
        });

        if (session && session.expires >= new Date()) {
          // Authenticated user — return stats
          return NextResponse.json(getMockStats());
        }
      } catch {
        // DB error — fall through to mock stats
      }
    }

    // For demo/unauthenticated access, still return mock stats
    return NextResponse.json(getMockStats());
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    );
  }
}

function getMockStats() {
  return {
    systemStatus: {
      api: 'online',
      database: 'connected',
      websocket: 'connected',
      solPriceFeed: 'active',
    },
    userStats: {
      totalUsers: 1247,
      activeUsers24h: 342,
      proEliteSubscribers: 89,
    },
    copyTradeStats: {
      totalCopyTrades: 4521,
      successRate: 87.3,
      totalVolume: 2400000,
      avgExecutionTime: 1.2,
    },
    whaleStats: {
      activeWhales: 30,
      trackedWallets: 1847,
      alertsSent24h: 12453,
    },
    recentUsers: [
      { username: 'whale_hunter', email: 'hunter@example.com', plan: 'pro', status: 'active', joined: '2024-01-15' },
      { username: 'sol_trader', email: 'trader@example.com', plan: 'free', status: 'active', joined: '2024-01-14' },
      { username: 'degen_master', email: 'degen@example.com', plan: 'elite', status: 'active', joined: '2024-01-13' },
      { username: 'moon_shot', email: 'moon@example.com', plan: 'free', status: 'inactive', joined: '2024-01-12' },
      { username: 'crypto_sage', email: 'sage@example.com', plan: 'pro', status: 'active', joined: '2024-01-11' },
    ],
  };
}
