/**
 * POST /api/swap/quote
 * Get a Jupiter swap quote without executing
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSwapQuote, TOKEN_MINTS } from '@/lib/jupiter';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { inputToken, outputToken, amount, slippageBps = 50 } = body;

    if (!inputToken || !outputToken || !amount) {
      return NextResponse.json(
        { error: 'inputToken, outputToken, and amount are required' },
        { status: 400 }
      );
    }

    const inputMint = TOKEN_MINTS[inputToken.toUpperCase()] || inputToken;
    const outputMint = TOKEN_MINTS[outputToken.toUpperCase()] || outputToken;

    const quote = await getSwapQuote(inputMint, outputMint, amount, slippageBps);
    if (!quote) {
      return NextResponse.json(
        { error: 'No route found for this swap' },
        { status: 404 }
      );
    }

    return NextResponse.json({ quote });
  } catch (error) {
    console.error('Swap quote error:', error);
    return NextResponse.json(
      { error: 'Failed to get swap quote' },
      { status: 500 }
    );
  }
}
