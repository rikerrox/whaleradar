import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface ActivityItem {
  id: string;
  type: string;
  title: string;
  description: string;
  amount?: number | null;
  token?: string | null;
  status?: string | null;
  metadata?: string | null;
  createdAt: Date;
}

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
    const typeFilter = searchParams.get('type') || '';

    // Valid activity type filters
    const validTypes = [
      'deposit',
      'withdrawal',
      'copy_trade',
      'copy_trade_execution',
      'alert_trigger',
      'plan_change',
      'payment',
      'referral',
    ];
    if (typeFilter && !validTypes.includes(typeFilter)) {
      return NextResponse.json(
        { error: `Invalid type filter. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    const userId = session.userId;
    const activities: ActivityItem[] = [];

    // Fetch transactions (deposits, withdrawals, payments, referrals)
    const shouldFetchTransactions =
      !typeFilter ||
      ['deposit', 'withdrawal', 'payment', 'referral'].includes(typeFilter);

    if (shouldFetchTransactions) {
      const transactionWhere: Record<string, unknown> = { userId };
      if (typeFilter && ['deposit', 'withdrawal', 'payment', 'referral'].includes(typeFilter)) {
        transactionWhere.type = typeFilter;
      }

      const transactions = await db.transaction.findMany({
        where: transactionWhere,
        orderBy: { createdAt: 'desc' },
        take: 100, // Fetch more than needed, we'll merge and slice
      });

      for (const tx of transactions) {
        activities.push({
          id: tx.id,
          type: tx.type, // deposit, withdrawal, payment, copy_trade, referral
          title: getActivityTitle(tx.type, tx.description),
          description: tx.description || getDefaultDescription(tx.type, tx.amount, tx.token),
          amount: tx.amount,
          token: tx.token,
          status: tx.status,
          metadata: tx.metadata,
          createdAt: tx.createdAt,
        });
      }
    }

    // Fetch copy trade executions
    const shouldFetchCopyTrades =
      !typeFilter || typeFilter === 'copy_trade_execution';

    if (shouldFetchCopyTrades) {
      const copyTrades = await db.copyTrade.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      for (const ct of copyTrades) {
        activities.push({
          id: ct.id,
          type: 'copy_trade_execution',
          title: `Copy Trade ${ct.type.toUpperCase()}: ${ct.tokenSymbol}`,
          description: `${ct.type === 'buy' ? 'Bought' : 'Sold'} ${ct.amount} ${ct.tokenSymbol} via copy trade${ct.pnl ? ` (PnL: ${ct.pnl >= 0 ? '+' : ''}${ct.pnl.toFixed(4)} SOL)` : ''}`,
          amount: ct.amount,
          token: ct.tokenSymbol,
          status: ct.status,
          metadata: JSON.stringify({
            whaleWalletId: ct.whaleWalletId,
            entryPrice: ct.entryPrice,
            exitPrice: ct.exitPrice,
            pnl: ct.pnl,
            stopLoss: ct.stopLoss,
            takeProfit: ct.takeProfit,
          }),
          createdAt: ct.createdAt,
        });
      }
    }

    // Fetch alert triggers
    const shouldFetchAlerts = !typeFilter || typeFilter === 'alert_trigger';

    if (shouldFetchAlerts) {
      const alerts = await db.alert.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      for (const alert of alerts) {
        activities.push({
          id: alert.id,
          type: 'alert_trigger',
          title: alert.title,
          description: alert.message,
          amount: null,
          token: alert.token,
          status: alert.isRead ? 'read' : 'unread',
          metadata: JSON.stringify({ channel: alert.channel, alertType: alert.type }),
          createdAt: alert.createdAt,
        });
      }
    }

    // Fetch plan changes (from subscription history)
    const shouldFetchPlanChanges = !typeFilter || typeFilter === 'plan_change';

    if (shouldFetchPlanChanges) {
      const subscriptions = await db.subscription.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      for (const sub of subscriptions) {
        activities.push({
          id: sub.id,
          type: 'plan_change',
          title: `Plan ${sub.status === 'active' ? 'Activated' : sub.status === 'cancelled' ? 'Cancelled' : sub.status === 'expired' ? 'Expired' : 'Updated'}: ${sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)}`,
          description: `${sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1)} plan${sub.amount ? ` at ${sub.amount} SOL` : ''}${sub.paymentMethod ? ` via ${sub.paymentMethod}` : ''}`,
          amount: sub.amount,
          token: 'SOL',
          status: sub.status,
          metadata: JSON.stringify({
            plan: sub.plan,
            paymentMethod: sub.paymentMethod,
            startDate: sub.startDate,
            endDate: sub.endDate,
          }),
          createdAt: sub.createdAt,
        });
      }
    }

    // Sort all activities by date (newest first) and paginate
    activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = activities.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedActivities = activities.slice(
      (page - 1) * limit,
      page * limit
    );

    return NextResponse.json({
      data: paginatedActivities,
      pagination: { page, limit, total, totalPages },
      filters: {
        availableTypes: validTypes,
        appliedType: typeFilter || null,
      },
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
  }
}

function getActivityTitle(type: string, description: string | null): string {
  if (description) return description;
  switch (type) {
    case 'deposit':
      return 'SOL Deposit';
    case 'withdrawal':
      return 'SOL Withdrawal';
    case 'payment':
      return 'Payment Processed';
    case 'copy_trade':
      return 'Copy Trade Transaction';
    case 'referral':
      return 'Referral Bonus';
    default:
      return 'Transaction';
  }
}

function getDefaultDescription(type: string, amount: number, token: string | null): string {
  const tokenStr = token || 'SOL';
  switch (type) {
    case 'deposit':
      return `Deposited ${amount} ${tokenStr}`;
    case 'withdrawal':
      return `Withdrew ${amount} ${tokenStr}`;
    case 'payment':
      return `Payment of ${amount} ${tokenStr}`;
    case 'copy_trade':
      return `Copy trade transaction of ${amount} ${tokenStr}`;
    case 'referral':
      return `Referral reward of ${amount} ${tokenStr}`;
    default:
      return `Transaction of ${amount} ${tokenStr}`;
  }
}
