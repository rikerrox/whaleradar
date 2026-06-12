/**
 * POST /api/webhook/helius
 * Receives real-time transaction data from Helius webhooks
 * Processes whale trades and triggers copy trades
 */
import { NextRequest, NextResponse } from 'next/server';
import { parseHeliusTransaction } from '@/lib/helius';

export const dynamic = 'force-dynamic';

// In-memory store of recent whale alerts (in production, use Redis)
const recentAlerts: Array<{
  signature: string;
  type: string;
  wallet: string;
  timestamp: Date;
  details: any;
}> = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Helius sends an array of webhook data
    const transactions = body?.transactions || [body];

    for (const tx of transactions) {
      if (!tx?.signature) continue;

      const parsed = parseHeliusTransaction(tx);
      
      // Check for large token swaps
      for (const swap of parsed.swaps) {
        const alert = {
          signature: parsed.signature,
          type: parsed.type,
          wallet: swap.from,
          timestamp: new Date(parsed.timestamp * 1000),
          details: {
            tokenMint: swap.mint,
            amount: swap.amount,
            to: swap.to,
          },
        };

        recentAlerts.unshift(alert);
        if (recentAlerts.length > 100) recentAlerts.pop();

        // In production: trigger copy trades here
        // await triggerCopyTrades(alert);
      }

      // Check for large SOL transfers
      for (const native of parsed.nativeSwaps) {
        if (native.sol >= 10) { // Only alert for transfers >= 10 SOL
          const alert = {
            signature: parsed.signature,
            type: 'native_transfer',
            wallet: native.from,
            timestamp: new Date(parsed.timestamp * 1000),
            details: {
              sol: native.sol,
              to: native.to,
            },
          };

          recentAlerts.unshift(alert);
          if (recentAlerts.length > 100) recentAlerts.pop();
        }
      }
    }

    return NextResponse.json({ received: true, alertCount: recentAlerts.length });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * GET /api/webhook/helius
 * Returns recent whale alerts
 */
export async function GET() {
  return NextResponse.json({ alerts: recentAlerts.slice(0, 50) });
}
