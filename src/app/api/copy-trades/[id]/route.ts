import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await db.session.findUnique({ where: { sessionToken } });
    if (!session || session.expires < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const { id } = await params;
    const copyTrade = await db.copyTrade.findFirst({
      where: { id, userId: session.userId },
    });

    if (!copyTrade) {
      return NextResponse.json({ error: 'Copy trade not found' }, { status: 404 });
    }

    return NextResponse.json({ data: copyTrade });
  } catch (error) {
    console.error('Error fetching copy trade:', error);
    return NextResponse.json({ error: 'Failed to fetch copy trade' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await db.session.findUnique({ where: { sessionToken } });
    if (!session || session.expires < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, pnl, exitPrice } = body;

    const existingTrade = await db.copyTrade.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingTrade) {
      return NextResponse.json({ error: 'Copy trade not found' }, { status: 404 });
    }

    // Can only cancel pending trades
    if (status === 'cancelled' && existingTrade.status !== 'pending') {
      return NextResponse.json({ error: 'Can only cancel pending trades' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { status };
    if (pnl !== undefined) updateData.pnl = pnl;
    if (exitPrice !== undefined) updateData.exitPrice = exitPrice;

    const updatedTrade = await db.copyTrade.update({
      where: { id },
      data: updateData,
    });

    // If cancelling a buy trade, refund SOL
    if (status === 'cancelled' && existingTrade.type === 'buy' && existingTrade.status === 'pending') {
      const user = await db.user.findUnique({ where: { id: session.userId } });
      if (user) {
        await db.user.update({
          where: { id: session.userId },
          data: { solBalance: user.solBalance + existingTrade.amount },
        });
      }
    }

    // If trade executed with PnL, update balance
    if (status === 'executed' && pnl !== undefined) {
      const user = await db.user.findUnique({ where: { id: session.userId } });
      if (user) {
        // For sells, add the proceeds + PnL
        if (existingTrade.type === 'sell') {
          await db.user.update({
            where: { id: session.userId },
            data: { solBalance: user.solBalance + existingTrade.amount + pnl },
          });
        } else {
          // For buys, PnL is unrealized but track it
          await db.user.update({
            where: { id: session.userId },
            data: { solBalance: user.solBalance + pnl },
          });
        }
      }
    }

    return NextResponse.json({ data: updatedTrade });
  } catch (error) {
    console.error('Error updating copy trade:', error);
    return NextResponse.json({ error: 'Failed to update copy trade' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await db.session.findUnique({ where: { sessionToken } });
    if (!session || session.expires < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    const { id } = await params;
    const existingTrade = await db.copyTrade.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existingTrade) {
      return NextResponse.json({ error: 'Copy trade not found' }, { status: 404 });
    }

    // Cancel instead of delete
    const updatedTrade = await db.copyTrade.update({
      where: { id },
      data: { status: 'cancelled' },
    });

    // Refund SOL if pending buy
    if (existingTrade.type === 'buy' && existingTrade.status === 'pending') {
      const user = await db.user.findUnique({ where: { id: session.userId } });
      if (user) {
        await db.user.update({
          where: { id: session.userId },
          data: { solBalance: user.solBalance + existingTrade.amount },
        });
      }
    }

    return NextResponse.json({ data: updatedTrade });
  } catch (error) {
    console.error('Error deleting copy trade:', error);
    return NextResponse.json({ error: 'Failed to cancel copy trade' }, { status: 500 });
  }
}
