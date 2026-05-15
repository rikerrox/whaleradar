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
    const skip = (page - 1) * limit;

    const users = await db.user.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        username: true,
        plan: true,
        role: true,
        solBalance: true,
        isActive: true,
        createdAt: true,
      },
    });

    const total = await db.user.count();

    return NextResponse.json({
      data: users.map((u) => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      })),
      meta: { page, limit, total },
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (typeof body.isActive === 'boolean') {
      updateData.isActive = body.isActive;
    }
    if (body.role && ['user', 'admin'].includes(body.role)) {
      updateData.role = body.role;
    }
    if (body.plan && ['free', 'pro', 'elite'].includes(body.plan)) {
      updateData.plan = body.plan;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        plan: true,
        role: true,
        solBalance: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      data: { ...updatedUser, createdAt: updatedUser.createdAt.toISOString() },
    });
  } catch (error) {
    console.error('Error updating admin user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
