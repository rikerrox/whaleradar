import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

const PLAN_PRICES: Record<string, { monthly: number; annual: number }> = {
  pro: { monthly: 9.99, annual: 95.90 },
  elite: { monthly: 19.99, annual: 191.90 },
  ultimate: { monthly: 29.99, annual: 287.90 },
};

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
    const { plan, billing = 'monthly' } = body;

    if (!plan || !PLAN_PRICES[plan]) {
      return NextResponse.json({ error: 'Invalid plan. Choose pro or elite.' }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { id: session.userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.plan === plan) {
      return NextResponse.json({ error: `Already on ${plan} plan` }, { status: 409 });
    }

    const price = PLAN_PRICES[plan][billing as 'monthly' | 'annual'] || PLAN_PRICES[plan].monthly;

    // Create a simulated checkout session
    const checkoutId = `cs_${crypto.randomUUID().replace(/-/g, '')}`;
    const paymentIntentId = `pi_${crypto.randomUUID().replace(/-/g, '')}`;

    // Store pending payment in subscription record
    await db.subscription.create({
      data: {
        userId: user.id,
        plan,
        status: 'pending',
        stripeSessionId: checkoutId,
        paymentMethod: 'card',
        amount: price,
        startDate: new Date(),
        endDate: new Date(Date.now() + (billing === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000),
      },
    });

    // Create a transaction record
    await db.transaction.create({
      data: {
        userId: user.id,
        type: 'payment',
        amount: price,
        token: 'USD',
        status: 'pending',
        description: `${plan.charAt(0).toUpperCase() + plan.slice(1)} plan - ${billing}`,
        metadata: JSON.stringify({ checkoutId, paymentIntentId, plan, billing }),
      },
    });

    return NextResponse.json({
      data: {
        checkoutId,
        paymentIntentId,
        amount: price,
        currency: 'USD',
        plan,
        billing,
        // Simulated Stripe checkout URL
        checkoutUrl: `/api/payments/verify?session_id=${checkoutId}`,
      },
    });
  } catch (error) {
    console.error('Error creating checkout:', error);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
