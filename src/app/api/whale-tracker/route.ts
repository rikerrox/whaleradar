/**
 * GET /api/whale-tracker
 * Fetches real whale activity from Birdeye API
 * Falls back to mock data if no API key
 */
import { NextRequest, NextResponse } from 'next/server';
import { getLargeTrades, getWalletTrades } from '@/lib/birdeye';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');
  const minUsd = parseInt(searchParams.get('minUsd') || '5000');
  const limit = parseInt(searchParams.get('limit') || '50');

  try {
    if (wallet) {
      // Get trades for specific whale wallet
      const trades = await getWalletTrades(wallet, limit);
      return NextResponse.json({ trades, source: 'birdeye' });
    }

    // Get large trades across Solana
    const trades = await getLargeTrades(minUsd, limit);
    return NextResponse.json({ trades, source: 'birdeye' });
  } catch (error) {
    console.error('Whale tracker error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch whale data', trades: [], source: 'error' },
      { status: 500 }
    );
  }
}
