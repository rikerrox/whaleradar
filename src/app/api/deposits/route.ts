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

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const type = searchParams.get('type') || '';

    const where: Record<string, unknown> = { userId: session.userId };
    if (type) where.type = type;

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.transaction.count({ where }),
    ]);

    return NextResponse.json({
      data: transactions,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching deposits:', error);
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 });
  }
}

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
    const { amount, token = 'SOL', txHash, method = 'phantom' } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be greater than 0' }, { status: 400 });
    }

    if (amount > 10000) {
      return NextResponse.json({ error: 'Maximum deposit amount is 10,000 SOL' }, { status: 400 });
    }

    // Create deposit transaction
    const transaction = await db.transaction.create({
      data: {
        userId: session.userId,
        type: 'deposit',
        amount,
        token,
        status: 'completed', // In demo mode, auto-complete deposits
        txHash: txHash || `deposit_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`,
        description: `Deposit ${amount} ${token} via ${method}`,
        metadata: JSON.stringify({ method }),
      },
    });

    // Update user SOL balance
    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (user) {
      await db.user.update({
        where: { id: session.userId },
        data: { solBalance: user.solBalance + amount },
      });
    }

    // Create alert for deposit
    await db.alert.create({
      data: {
        userId: session.userId,
        type: 'copy_trade',
        title: 'Deposit Successful',
        message: `${amount} ${token} has been deposited to your account`,
        isRead: false,
        channel: 'browser',
      },
    });

    return NextResponse.json({
      data: {
        transaction,
        newBalance: (user?.solBalance || 0) + amount,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating deposit:', error);
    return NextResponse.json({ error: 'Deposit failed' }, { status: 500 });
  }
}
