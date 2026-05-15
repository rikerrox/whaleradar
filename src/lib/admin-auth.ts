import { db } from '@/lib/db';
import { NextRequest } from 'next/server';

interface AdminAuthResult {
  authorized: true;
  user: Awaited<ReturnType<typeof db.user.findUnique>>;
  session: Awaited<ReturnType<typeof db.session.findUnique>>;
}

interface AdminAuthFailure {
  authorized: false;
  error: string;
}

export type AdminAuthResponse = AdminAuthResult | AdminAuthFailure;

export async function verifyAdmin(request: NextRequest): Promise<AdminAuthResponse> {
  const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!sessionToken) {
    return { authorized: false, error: 'Not authenticated' };
  }

  const session = await db.session.findUnique({ where: { sessionToken } });
  if (!session || session.expires < new Date()) {
    return { authorized: false, error: 'Session expired' };
  }

  const user = await db.user.findUnique({ where: { id: session.userId } });
  if (!user || user.role !== 'admin') {
    return { authorized: false, error: 'Admin access required' };
  }

  return { authorized: true, user, session };
}
