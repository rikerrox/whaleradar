import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUserWithEmail(email: string, username: string, password: string) {
  const passwordHash = await hashPassword(password);
  
  const user = await db.user.create({
    data: {
      email,
      username,
      passwordHash,
      plan: 'free',
      solBalance: 0,
      subscriptions: {
        create: {
          plan: 'free',
          status: 'active',
          paymentMethod: 'none',
          amount: 0,
        },
      },
    },
    include: {
      subscriptions: {
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return user;
}

export async function createUserWithWallet(walletAddress: string, username?: string) {
  const user = await db.user.create({
    data: {
      walletAddress,
      username: username || null,
      plan: 'free',
      solBalance: 0,
      wallets: {
        create: {
          address: walletAddress,
          isWhale: false,
        },
      },
      subscriptions: {
        create: {
          plan: 'free',
          status: 'active',
          paymentMethod: 'none',
          amount: 0,
        },
      },
    },
    include: {
      wallets: true,
      subscriptions: {
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return user;
}

export async function authenticateUser(email: string, password: string) {
  const user = await db.user.findUnique({
    where: { email },
    include: {
      subscriptions: {
        where: { status: 'active' },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!user || !user.passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return user;
}

export async function getUserStats(userId: string) {
  const [alertCount, activeCopyTrades, watchlistCount, activeSubscription] = await Promise.all([
    db.alert.count({ where: { userId, isRead: false } }),
    db.copyTrade.count({ where: { userId, status: { in: ['pending', 'executed'] } } }),
    db.watchlist.count({ where: { userId } }),
    db.subscription.findFirst({ where: { userId, status: 'active' }, orderBy: { createdAt: 'desc' } }),
  ]);

  return {
    unreadAlerts: alertCount,
    activeCopyTrades,
    watchlistCount,
    subscription: activeSubscription,
  };
}

export function generateSessionToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 64; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}
