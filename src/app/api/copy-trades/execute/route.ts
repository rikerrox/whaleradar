import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await db.session.findUnique({ where: { sessionToken } });
    if (!session || session.expires < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const body = await request.json();
    const {
      whaleWalletId,
      whaleLabel,
      tokenAddress,
      tokenSymbol,
      tokenName,
      type,
      amount,
      copyPercent = 100,
      stopLoss,
      takeProfit,
      maxPosition,
      slippage = 1,
    } = body;

    // Validate required fields
    if (!whaleWalletId) {
      return NextResponse.json({ error: 'Whale wallet ID is required' }, { status: 400 });
    }
    if (!tokenAddress || !tokenSymbol) {
      return NextResponse.json({ error: 'Token address and symbol are required' }, { status: 400 });
    }
    if (!type || !['buy', 'sell'].includes(type)) {
      return NextResponse.json({ error: 'Type must be buy or sell' }, { status: 400 });
    }
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check balance
    if (type === 'buy' && user.solBalance < amount) {
      return NextResponse.json(
        { error: 'Insufficient SOL balance. Please deposit more SOL.' },
        { status: 400 }
      );
    }

    // Check plan limits
    const activeCopyTradesCount = await db.copyTrade.count({
      where: { userId: user.id, status: { in: ['pending', 'executed'] } },
    });

    const planLimits: Record<string, number> = { free: 3, pro: 20, elite: 999 };
    const planLimit = planLimits[user.plan] || planLimits.free;
    
    if (activeCopyTradesCount >= planLimit) {
      return NextResponse.json(
        { error: `Copy trade limit reached for ${user.plan} plan (${planLimit} active trades). Upgrade your plan for more.` },
        { status: 403 }
      );
    }

    // Check stop-loss and take-profit
    if (stopLoss && stopLoss > 50) {
      return NextResponse.json({ error: 'Stop loss cannot exceed 50%' }, { status: 400 });
    }
    if (takeProfit && takeProfit > 500) {
      return NextResponse.json({ error: 'Take profit cannot exceed 500%' }, { status: 400 });
    }

    // Simulate current token price
    const currentPrice = Math.random() * 0.5 + 0.0001;
    
    // Create the copy trade record
    const copyTrade = await db.copyTrade.create({
      data: {
        userId: user.id,
        whaleWalletId,
        tokenAddress,
        tokenSymbol,
        type,
        amount,
        copyPercent,
        stopLoss: stopLoss || null,
        takeProfit: takeProfit || null,
        maxPosition: maxPosition || null,
        slippage,
        status: 'pending',
        entryPrice: currentPrice,
      },
    });

    // Deduct SOL from user balance for buy orders
    if (type === 'buy') {
      await db.user.update({
        where: { id: user.id },
        data: { solBalance: user.solBalance - amount },
      });

      await db.transaction.create({
        data: {
          userId: user.id,
          type: 'copy_trade',
          amount,
          token: 'SOL',
          status: 'completed',
          description: `Copy trade: ${type} ${tokenSymbol} for ${amount} SOL`,
          metadata: JSON.stringify({ copyTradeId: copyTrade.id, whaleLabel }),
        },
      });
    }

    // Simulate trade execution (in real app, this would be async via Solana)
    // We simulate a delay then update the trade status
    const executionDelay = 2000 + Math.random() * 3000; // 2-5 seconds
    const success = Math.random() > 0.12; // 88% success rate
    
    // Return the pending trade immediately
    return NextResponse.json({
      data: {
        copyTrade,
        executionDelay,
        estimatedSuccess: success,
        message: 'Copy trade submitted. Execution in progress...',
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error executing copy trade:', error);
    return NextResponse.json({ error: 'Failed to execute copy trade' }, { status: 500 });
  }
}
