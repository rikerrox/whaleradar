import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// GET /api/trades - Fetch recent trades with filtering by whale, token, type
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // Filtering
    const walletId = searchParams.get('walletId') || ''
    const walletAddress = searchParams.get('walletAddress') || ''
    const tokenAddress = searchParams.get('tokenAddress') || ''
    const tokenSymbol = searchParams.get('tokenSymbol') || ''
    const type = searchParams.get('type') || '' // buy, sell
    const dex = searchParams.get('dex') || ''
    const minTotalValue = searchParams.get('minTotalValue')
      ? parseFloat(searchParams.get('minTotalValue')!)
      : undefined
    const maxTotalValue = searchParams.get('maxTotalValue')
      ? parseFloat(searchParams.get('maxTotalValue')!)
      : undefined
    const startDate = searchParams.get('startDate') || ''
    const endDate = searchParams.get('endDate') || ''
    const whaleOnly = searchParams.get('whaleOnly') === 'true'

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'timestamp'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    // Build where clause using Prisma type
    const where: Prisma.TradeWhereInput = {}

    // Filter by wallet ID
    if (walletId) {
      where.walletId = walletId
    }

    // Filter by wallet address (requires nested wallet lookup)
    if (walletAddress) {
      where.wallet = { address: { contains: walletAddress } }
    }

    // Filter for whale-only trades
    if (whaleOnly) {
      const existingWallet = where.wallet as Prisma.WalletWhereInput | undefined
      where.wallet = {
        ...(existingWallet || {}),
        isWhale: true,
      }
    }

    // Filter by token address
    if (tokenAddress) {
      where.tokenAddress = tokenAddress
    }

    // Filter by token symbol
    if (tokenSymbol) {
      where.tokenSymbol = { contains: tokenSymbol }
    }

    // Filter by trade type
    if (type) {
      where.type = type
    }

    // Filter by DEX
    if (dex) {
      where.dex = dex
    }

    // Total value range filter
    if (minTotalValue !== undefined || maxTotalValue !== undefined) {
      where.totalValue = {}
      if (minTotalValue !== undefined) where.totalValue.gte = minTotalValue
      if (maxTotalValue !== undefined) where.totalValue.lte = maxTotalValue
    }

    // Date range filter
    if (startDate || endDate) {
      where.timestamp = {}
      if (startDate) where.timestamp.gte = new Date(startDate)
      if (endDate) where.timestamp.lte = new Date(endDate)
    }

    // Valid sort fields
    const validSortFields = [
      'timestamp',
      'totalValue',
      'amount',
      'price',
    ]

    const sortField = validSortFields.includes(sortBy) ? sortBy : 'timestamp'
    const orderBy = { [sortField]: sortOrder }

    const [trades, total] = await Promise.all([
      db.trade.findMany({
        where,
        include: {
          wallet: {
            select: {
              id: true,
              address: true,
              label: true,
              isWhale: true,
              whaleProfile: true,
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.trade.count({ where }),
    ])

    return NextResponse.json({
      data: trades,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching trades:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trades' },
      { status: 500 }
    )
  }
}

// POST /api/trades - Record a new trade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      walletId,
      walletAddress,
      tokenAddress,
      tokenSymbol,
      tokenName,
      type,
      amount,
      price,
      totalValue,
      txHash,
      dex,
    } = body

    // Require either walletId or walletAddress
    if (!walletId && !walletAddress) {
      return NextResponse.json(
        { error: 'Either walletId or walletAddress is required' },
        { status: 400 }
      )
    }

    if (!tokenAddress || !tokenSymbol || !tokenName) {
      return NextResponse.json(
        { error: 'tokenAddress, tokenSymbol, and tokenName are required' },
        { status: 400 }
      )
    }

    if (!type || !['buy', 'sell'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be "buy" or "sell"' },
        { status: 400 }
      )
    }

    if (amount === undefined || price === undefined) {
      return NextResponse.json(
        { error: 'amount and price are required' },
        { status: 400 }
      )
    }

    // Resolve wallet
    let resolvedWalletId = walletId
    if (!resolvedWalletId && walletAddress) {
      const wallet = await db.wallet.findUnique({
        where: { address: walletAddress },
      })
      if (!wallet) {
        return NextResponse.json(
          { error: 'Wallet not found' },
          { status: 404 }
        )
      }
      resolvedWalletId = wallet.id
    }

    // Calculate total value if not provided
    const calculatedTotalValue = totalValue ?? (amount * price)

    const trade = await db.trade.create({
      data: {
        walletId: resolvedWalletId!,
        tokenAddress,
        tokenSymbol,
        tokenName,
        type,
        amount,
        price,
        totalValue: calculatedTotalValue,
        txHash: txHash || null,
        dex: dex || null,
      },
      include: {
        wallet: {
          select: {
            id: true,
            address: true,
            label: true,
            isWhale: true,
          },
        },
      },
    })

    // Update wallet stats
    await db.wallet.update({
      where: { id: resolvedWalletId! },
      data: {
        totalTrades: { increment: 1 },
        totalPnl: type === 'sell' ? { increment: calculatedTotalValue } : { decrement: calculatedTotalValue },
        lastActive: new Date(),
      },
    })

    return NextResponse.json({ data: trade }, { status: 201 })
  } catch (error) {
    console.error('Error recording trade:', error)
    return NextResponse.json(
      { error: 'Failed to record trade' },
      { status: 500 }
    )
  }
}
