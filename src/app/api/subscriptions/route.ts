import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/subscriptions - Get current subscription status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        subscriptions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get active subscription
    const activeSubscription = await db.subscription.findFirst({
      where: { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
    })

    // Plan features and limits
    const planFeatures: Record<string, {
      name: string
      price: number
      features: string[]
      limits: Record<string, number>
    }> = {
      free: {
        name: 'Free',
        price: 0,
        features: [
          'Basic whale tracking',
          '5 alerts per day',
          'Token scanner',
          'Community access',
        ],
        limits: {
          maxCopyTrades: 3,
          maxAlertsPerDay: 5,
          maxWatchlist: 10,
          maxWhaleFollows: 5,
        },
      },
      pro: {
        name: 'Pro',
        price: 29,
        features: [
          'Advanced whale tracking',
          'Unlimited alerts',
          'Token scanner with filters',
          'Copy trading',
          'Priority support',
          'Telegram/Discord notifications',
        ],
        limits: {
          maxCopyTrades: 20,
          maxAlertsPerDay: -1, // unlimited
          maxWatchlist: 100,
          maxWhaleFollows: 50,
        },
      },
      elite: {
        name: 'Elite',
        price: 99,
        features: [
          'All Pro features',
          'Unlimited copy trading',
          'AI-powered insights',
          'Custom alert strategies',
          'Early access to new features',
          'Dedicated support',
          'API access',
        ],
        limits: {
          maxCopyTrades: -1, // unlimited
          maxAlertsPerDay: -1,
          maxWatchlist: -1,
          maxWhaleFollows: -1,
        },
      },
    }

    // Current usage
    const currentUsage = {
      activeCopyTrades: await db.copyTrade.count({
        where: { userId, status: { in: ['pending', 'executed'] } },
      }),
      watchlistCount: await db.watchlist.count({
        where: { userId },
      }),
      alertsToday: await db.alert.count({
        where: {
          userId,
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
    }

    // Subscription history
    const subscriptionHistory = user.subscriptions

    return NextResponse.json({
      data: {
        currentPlan: user.plan,
        activeSubscription,
        planFeatures: planFeatures[user.plan] || planFeatures.free,
        allPlans: planFeatures,
        currentUsage,
        subscriptionHistory,
      },
    })
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: 'Failed to fetch subscription status' },
      { status: 500 }
    )
  }
}

// POST /api/subscriptions - Update subscription plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, plan, stripeSessionId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    if (!plan || !['free', 'pro', 'elite'].includes(plan)) {
      return NextResponse.json(
        { error: 'plan must be one of: free, pro, elite' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if already on this plan
    if (user.plan === plan) {
      return NextResponse.json(
        { error: `Already on ${plan} plan` },
        { status: 409 }
      )
    }

    // Deactivate current active subscription
    await db.subscription.updateMany({
      where: { userId, status: 'active' },
      data: { status: 'cancelled' },
    })

    // Calculate end date (30 days from now for paid plans)
    const startDate = new Date()
    const endDate = plan !== 'free'
      ? new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000)
      : null

    // Create new subscription
    const subscription = await db.subscription.create({
      data: {
        userId,
        plan,
        status: 'active',
        startDate,
        endDate,
        stripeSessionId: stripeSessionId || null,
      },
    })

    // Update user plan
    await db.user.update({
      where: { id: userId },
      data: { plan },
    })

    return NextResponse.json({
      data: {
        subscription,
        previousPlan: user.plan,
        newPlan: plan,
      },
    })
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}
