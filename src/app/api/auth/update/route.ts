import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function PATCH(request: NextRequest) {
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
    const { username, email, walletAddress, newPassword, currentPassword } = body;

    const updateData: Record<string, unknown> = {};
    
    if (username) updateData.username = username;
    if (email) updateData.email = email;
    if (walletAddress) updateData.walletAddress = walletAddress;

    // Password change requires current password
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to change password' },
          { status: 400 }
        );
      }
      const user = await db.user.findUnique({ where: { id: session.userId } });
      if (!user?.passwordHash) {
        return NextResponse.json({ error: 'Cannot change password' }, { status: 400 });
      }
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
      }
      updateData.passwordHash = await hashPassword(newPassword);
    }

    const updatedUser = await db.user.update({
      where: { id: session.userId },
      data: updateData,
    });

    const { passwordHash: _, ...safeUser } = updatedUser;
    return NextResponse.json({ data: safeUser });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
