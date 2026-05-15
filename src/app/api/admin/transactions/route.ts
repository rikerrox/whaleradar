import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

async function verifyAdmin(request: NextRequest) {
  const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!sessionToken) return null;

  const session = await db.session.findUnique({
    where: { sessionToken },
    include: { user: true },
  });

  if (!session || session.expires < new Date() || session.user.role !== 'admin') {
    return null;
  }

  return session.user;
}

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const transactions = await db.transaction.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        type: true,
        amount: true,
        token: true,
        status: true,
        description: true,
        createdAt: true,
      },
    });

    const total = await db.transaction.count({ where });

    return NextResponse.json({
      data: transactions.map((tx) => ({
        ...tx,
        createdAt: tx.createdAt.toISOString(),
      })),
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching admin transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
