import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
    const { checkoutId, paymentMethod = 'card' } = body;

    if (!checkoutId) {
      return NextResponse.json({ error: 'Checkout ID is required' }, { status: 400 });
    }

    // Find the pending subscription
    const pendingSub = await db.subscription.findFirst({
      where: {
        userId: session.userId,
        stripeSessionId: checkoutId,
        status: 'pending',
      },
    });

    if (!pendingSub) {
      return NextResponse.json({ error: 'No pending payment found' }, { status: 404 });
    }

    // Simulate payment processing (in real app, verify with Stripe)
    const paymentSuccess = true; // Simulated - always succeeds in demo

    if (paymentSuccess) {
      // Deactivate current active subscriptions
      await db.subscription.updateMany({
        where: { userId: session.userId, status: 'active' },
        data: { status: 'cancelled' },
      });

      // Activate the new subscription
      await db.subscription.update({
        where: { id: pendingSub.id },
        data: {
          status: 'active',
          startDate: new Date(),
          paymentMethod,
        },
      });

      // Update user plan
      await db.user.update({
        where: { id: session.userId },
        data: { plan: pendingSub.plan },
      });

      // Update the transaction
      await db.transaction.updateMany({
        where: {
          userId: session.userId,
          type: 'payment',
          status: 'pending',
          description: { contains: pendingSub.plan },
        },
        data: { status: 'completed' },
      });

      // Create alert
      await db.alert.create({
        data: {
          userId: session.userId,
          type: 'copy_trade',
          title: 'Subscription Upgraded',
          message: `Your plan has been upgraded to ${pendingSub.plan.charAt(0).toUpperCase() + pendingSub.plan.slice(1)}!`,
          isRead: false,
          channel: 'browser',
        },
      });

      return NextResponse.json({
        data: {
          success: true,
          plan: pendingSub.plan,
          status: 'active',
          amount: pendingSub.amount,
        },
      });
    } else {
      // Payment failed
      await db.subscription.update({
        where: { id: pendingSub.id },
        data: { status: 'expired' },
      });

      await db.transaction.updateMany({
        where: {
          userId: session.userId,
          type: 'payment',
          status: 'pending',
        },
        data: { status: 'failed' },
      });

      return NextResponse.json({
        data: { success: false, error: 'Payment failed' },
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
  }
}

// GET for redirect-based payment verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('session_id');
  
  if (!sessionId) {
    return NextResponse.redirect(new URL('/?payment=error', request.url));
  }

  // Redirect to dashboard with success
  return NextResponse.redirect(new URL('/?payment=success', request.url));
}
