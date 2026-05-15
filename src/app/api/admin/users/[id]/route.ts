import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAdmin } from '@/lib/admin-auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/admin/users/[id] — Detailed user info
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === 'Admin access required' ? 403 : 401 });
    }

    const { id } = await context.params;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        wallets: true,
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        copyTrades: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        subscriptions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Strip passwordHash
    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json({ data: safeUser });
  } catch (error) {
    console.error('Error fetching admin user detail:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// PATCH /api/admin/users/[id] — Update user
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === 'Admin access required' ? 403 : 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    // Verify user exists
    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build update data (only allow specific fields)
    const updateData: Record<string, unknown> = {};

    if (body.plan !== undefined) {
      const validPlans = ['free', 'pro', 'elite'];
      if (!validPlans.includes(body.plan)) {
        return NextResponse.json({ error: 'Invalid plan. Must be: free, pro, or elite' }, { status: 400 });
      }
      updateData.plan = body.plan;
    }

    if (body.role !== undefined) {
      const validRoles = ['user', 'admin'];
      if (!validRoles.includes(body.role)) {
        return NextResponse.json({ error: 'Invalid role. Must be: user or admin' }, { status: 400 });
      }
      updateData.role = body.role;
    }

    if (body.isActive !== undefined) {
      if (typeof body.isActive !== 'boolean') {
        return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 });
      }
      // Prevent self-deactivation
      if (body.isActive === false && id === auth.user!.id) {
        return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 });
      }
      updateData.isActive = body.isActive;
    }

    if (body.solBalance !== undefined) {
      if (typeof body.solBalance !== 'number' || body.solBalance < 0) {
        return NextResponse.json({ error: 'solBalance must be a non-negative number' }, { status: 400 });
      }
      updateData.solBalance = body.solBalance;
    }

    if (body.username !== undefined) {
      if (typeof body.username !== 'string' || body.username.trim().length === 0) {
        return NextResponse.json({ error: 'Username must be a non-empty string' }, { status: 400 });
      }
      // Check uniqueness if username is being changed
      if (body.username !== existingUser.username) {
        const duplicate = await db.user.findFirst({ where: { username: body.username, id: { not: id } } });
        if (duplicate) {
          return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
        }
      }
      updateData.username = body.username.trim();
    }

    if (body.email !== undefined) {
      if (typeof body.email !== 'string' || body.email.trim().length === 0) {
        return NextResponse.json({ error: 'Email must be a non-empty string' }, { status: 400 });
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(body.email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
      }
      // Check uniqueness if email is being changed
      if (body.email !== existingUser.email) {
        const duplicate = await db.user.findFirst({ where: { email: body.email, id: { not: id } } });
        if (duplicate) {
          return NextResponse.json({ error: 'Email already taken' }, { status: 409 });
        }
      }
      updateData.email = body.email.trim();
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id },
      data: updateData,
    });

    const { passwordHash: _, ...safeUser } = updatedUser;

    return NextResponse.json({ data: safeUser });
  } catch (error) {
    console.error('Error updating admin user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] — Soft or hard delete
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.authorized) {
      return NextResponse.json({ error: auth.error }, { status: auth.error === 'Admin access required' ? 403 : 401 });
    }

    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const hard = searchParams.get('hard') === 'true';

    // Verify user exists
    const existingUser = await db.user.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent self-deletion
    if (id === auth.user!.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    if (hard) {
      // Hard delete — permanently remove user and all cascading records
      await db.user.delete({ where: { id } });
      return NextResponse.json({ data: { id, deleted: true, hardDelete: true } });
    } else {
      // Soft delete — deactivate the user
      const updatedUser = await db.user.update({
        where: { id },
        data: { isActive: false },
      });
      const { passwordHash: _, ...safeUser } = updatedUser;
      return NextResponse.json({ data: { ...safeUser, softDeleted: true } });
    }
  } catch (error) {
    console.error('Error deleting admin user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
