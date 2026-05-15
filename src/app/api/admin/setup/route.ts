import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * POST /api/admin/setup
 * Claim admin role if no admin exists yet.
 * Requires a valid session token.
 */
export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Verify session
    const session = await db.session.findUnique({ where: { sessionToken } });
    if (!session || session.expires < new Date()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Check if any admin already exists
    const adminCount = await db.user.count({ where: { role: 'admin', isActive: true } });
    if (adminCount > 0) {
      return NextResponse.json(
        { error: 'Admin already exists. Contact an existing admin for promotion.' },
        { status: 403 }
      );
    }

    // Promote the current user to admin
    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: { role: 'admin' },
    });

    const { passwordHash: _, ...safeUser } = updatedUser;

    return NextResponse.json({
      data: safeUser,
      message: 'You have been promoted to admin. Refresh to see the Admin Panel in the sidebar.',
    });
  } catch (error) {
    console.error('Error setting up admin:', error);
    return NextResponse.json({ error: 'Failed to setup admin' }, { status: 500 });
  }
}

/**
 * GET /api/admin/setup
 * Check if admin setup is available (no admin exists yet)
 */
export async function GET() {
  try {
    const adminCount = await db.user.count({ where: { role: 'admin', isActive: true } });
    return NextResponse.json({
      data: {
        adminExists: adminCount > 0,
        canClaimAdmin: adminCount === 0,
      },
    });
  } catch (error) {
    console.error('Error checking admin setup:', error);
    return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 });
  }
}
