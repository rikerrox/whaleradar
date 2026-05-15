import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/auth - Wallet-based authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { walletAddress, username, avatar } = body

    if (!walletAddress) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Validate wallet address format (basic check for Solana-style addresses)
    if (walletAddress.length < 32 || walletAddress.length > 44) {
      return NextResponse.json(
        { error: 'Invalid wallet address format' },
        { status: 400 }
      )
    }

    // Find or create user
    let user = await db.user.findUnique({
      where: { walletAddress },
      include: {
        wallets: true,
        subscriptions: {
          where: { status: 'active' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    })

    if (user) {
      // Update user info if provided
      const updateData: Record<string, unknown> = {}
      if (username && username !== user.username) updateData.username = username
      if (avatar && avatar !== user.avatar) updateData.avatar = avatar

      if (Object.keys(updateData).length > 0) {
        user = await db.user.update({
          where: { id: user.id },
          data: updateData,
          include: {
            wallets: true,
            subscriptions: {
              where: { status: 'active' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        })
      }
    } else {
      // Create new user
      user = await db.user.create({
        data: {
          walletAddress,
          username: username || null,
          avatar: avatar || null,
          plan: 'free',
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
      })
    }

    // Get user stats
    const alertCount = await db.alert.count({
      where: { userId: user.id, isRead: false },
    })

    const activeCopyTrades = await db.copyTrade.count({
      where: { userId: user.id, status: { in: ['pending', 'executed'] } },
    })

    const watchlistCount = await db.watchlist.count({
      where: { userId: user.id },
    })

    const activeSubscription = user.subscriptions[0] || null

    return NextResponse.json({
      data: {
        ...user,
        stats: {
          unreadAlerts: alertCount,
          activeCopyTrades,
          watchlistCount,
        },
        subscription: activeSubscription,
      },
      isNewUser: user.createdAt === user.updatedAt,
    })
  } catch (error) {
    console.error('Error authenticating wallet:', error)
    return NextResponse.json(
      { error: 'Failed to authenticate wallet' },
      { status: 500 }
    )
  }
}
