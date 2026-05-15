import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySolanaTransaction, WHALE_RADAR_DEPOSIT_WALLET } from '@/lib/wallet-server';

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
    const { txHash, amount, walletAddress } = body;

    if (!txHash) {
      return NextResponse.json({ error: 'Transaction hash is required' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    // Check if this transaction was already processed
    const existingTx = await db.transaction.findFirst({
      where: { txHash, type: 'deposit' },
    });

    if (existingTx && existingTx.status === 'completed') {
      return NextResponse.json({
        data: {
          verified: true,
          alreadyProcessed: true,
          transaction: existingTx,
          message: 'Transaction already verified and processed',
        },
      });
    }

    // Verify the transaction on-chain
    const expectedLamports = Math.round(amount * 1_000_000_000);
    const verification = await verifySolanaTransaction(
      txHash,
      walletAddress,
      WHALE_RADAR_DEPOSIT_WALLET,
      expectedLamports
    );

    if (!verification.verified) {
      // Update existing pending transaction as failed if it exists
      if (existingTx) {
        await db.transaction.update({
          where: { id: existingTx.id },
          data: { status: 'failed', metadata: JSON.stringify({ verificationError: verification.error }) },
        });
      }

      return NextResponse.json({
        data: {
          verified: false,
          error: verification.error,
          details: verification,
        },
      }, { status: 400 });
    }

    // Transaction verified! Update or create the deposit record
    let transaction;
    if (existingTx) {
      transaction = await db.transaction.update({
        where: { id: existingTx.id },
        data: { status: 'completed' },
      });
    } else {
      transaction = await db.transaction.create({
        data: {
          userId: session.userId,
          type: 'deposit',
          amount: verification.solAmount,
          token: 'SOL',
          status: 'completed',
          txHash,
          description: `Deposit ${verification.solAmount} SOL via Phantom wallet (verified on-chain)`,
          metadata: JSON.stringify({
            method: 'phantom',
            slot: verification.slot,
            blockTime: verification.blockTime,
            from: verification.from,
            to: verification.to,
            lamports: verification.lamports,
          }),
        },
      });
    }

    // Update user balance
    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (user) {
      const depositAmount = verification.solAmount || amount;
      await db.user.update({
        where: { id: session.userId },
        data: { solBalance: user.solBalance + depositAmount },
      });

      // Create success alert
      await db.alert.create({
        data: {
          userId: session.userId,
          type: 'copy_trade',
          title: 'Deposit Verified ✓',
          message: `${depositAmount.toFixed(4)} SOL deposit verified on-chain and credited to your account`,
          isRead: false,
          channel: 'browser',
        },
      });

      return NextResponse.json({
        data: {
          verified: true,
          transaction,
          newBalance: user.solBalance + depositAmount,
          solAmount: depositAmount,
          solscanUrl: `https://solscan.io/tx/${txHash}`,
        },
      });
    }

    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  } catch (error) {
    console.error('Error verifying deposit:', error);
    return NextResponse.json({ error: 'Deposit verification failed' }, { status: 500 });
  }
}
