import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// GET /api/copy-trades - Fetch copy trades for the current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // User ID is required for copy trades
    const userId = searchParams.get('userId')
    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // Filtering
    const whaleWalletId = searchParams.get('whaleWalletId') || ''
    const status = searchParams.get('status') || '' // pending, executed, failed, cancelled
    const type = searchParams.get('type') || '' // buy, sell
    const tokenAddress = searchParams.get('tokenAddress') || ''

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    // Build where clause using Prisma type
    const where: Prisma.CopyTradeWhereInput = { userId }

    if (whaleWalletId) {
      where.whaleWalletId = whaleWalletId
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (tokenAddress) {
      where.tokenAddress = tokenAddress
    }

    // Valid sort fields
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'amount',
      'copyPercent',
      'pnl',
    ]

    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const orderBy: Prisma.CopyTradeOrderByWithRelationInput = { [sortField]: sortOrder }

    const [copyTrades, total] = await Promise.all([
      db.copyTrade.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      db.copyTrade.count({ where }),
    ])

    return NextResponse.json({
      data: copyTrades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching copy trades:', error)
    return NextResponse.json(
      { error: 'Failed to fetch copy trades' },
      { status: 500 }
    )
  }
}

// POST /api/copy-trades - Create a new copy trade configuration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      whaleWalletId,
      tokenAddress,
      tokenSymbol,
      type,
      amount,
      copyPercent,
      stopLoss,
      takeProfit,
      maxPosition,
      slippage,
    } = body

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    if (!whaleWalletId) {
      return NextResponse.json(
        { error: 'whaleWalletId is required' },
        { status: 400 }
      )
    }

    if (!tokenAddress || !tokenSymbol) {
      return NextResponse.json(
        { error: 'tokenAddress and tokenSymbol are required' },
        { status: 400 }
      )
    }

    if (!type || !['buy', 'sell'].includes(type)) {
      return NextResponse.json(
        { error: 'type must be "buy" or "sell"' },
        { status: 400 }
      )
    }

    if (amount === undefined || amount <= 0) {
      return NextResponse.json(
        { error: 'amount must be a positive number' },
        { status: 400 }
      )
    }

    // Verify user exists
    const user = await db.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Verify whale wallet exists
    const whaleWallet = await db.whaleWallet.findUnique({
      where: { id: whaleWalletId },
    })
    if (!whaleWallet) {
      return NextResponse.json(
        { error: 'Whale wallet not found' },
        { status: 404 }
      )
    }

    // Check plan limits
    const activeCopyTradesCount = await db.copyTrade.count({
      where: { userId, status: { in: ['pending', 'executed'] } },
    })

    const planLimits: Record<string, number> = {
      free: 3,
      pro: 20,
      elite: 999,
    }

    const planLimit = planLimits[user.plan] || planLimits.free
    if (activeCopyTradesCount >= planLimit) {
      return NextResponse.json(
        {
          error: `Copy trade limit reached for ${user.plan} plan (${planLimit} active trades)`,
          currentCount: activeCopyTradesCount,
          planLimit,
        },
        { status: 403 }
      )
    }

    const copyTrade = await db.copyTrade.create({
      data: {
        userId,
        whaleWalletId,
        tokenAddress,
        tokenSymbol,
        type,
        amount,
        copyPercent: copyPercent ?? 100,
        stopLoss: stopLoss ?? null,
        takeProfit: takeProfit ?? null,
        maxPosition: maxPosition ?? null,
        slippage: slippage ?? 1,
        status: 'pending',
      },
    })

    return NextResponse.json({ data: copyTrade }, { status: 201 })
  } catch (error) {
    console.error('Error creating copy trade:', error)
    return NextResponse.json(
      { error: 'Failed to create copy trade' },
      { status: 500 }
    )
  }
}
