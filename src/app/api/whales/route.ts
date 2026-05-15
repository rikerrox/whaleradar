import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// GET /api/whales - Fetch whale wallets with pagination, filtering, and sorting
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // Filtering
    const search = searchParams.get('search') || ''
    const minConfidence = searchParams.get('minConfidence')
      ? parseFloat(searchParams.get('minConfidence')!)
      : undefined
    const maxConfidence = searchParams.get('maxConfidence')
      ? parseFloat(searchParams.get('maxConfidence')!)
      : undefined
    const minRoi = searchParams.get('minRoi')
      ? parseFloat(searchParams.get('minRoi')!)
      : undefined
    const minWinRate = searchParams.get('minWinRate')
      ? parseFloat(searchParams.get('minWinRate')!)
      : undefined
    const tag = searchParams.get('tag') || ''
    const chain = searchParams.get('chain') || ''
    const isBlacklisted = searchParams.get('isBlacklisted')
    const isActive = searchParams.get('isActive')

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'confidence'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    // Build where clause using Prisma type
    const where: Prisma.WhaleWalletWhereInput = {}

    // Build wallet filter object for combined conditions
    const walletFilter: Prisma.WalletWhereInput = {}

    // Search by address or label
    if (search) {
      walletFilter.OR = [
        { address: { contains: search } },
        { label: { contains: search } },
      ]
    }

    // ROI filter (on related Wallet)
    if (minRoi !== undefined) {
      walletFilter.roi = { gte: minRoi }
    }

    // Win rate filter (on related Wallet)
    if (minWinRate !== undefined) {
      walletFilter.winRate = { gte: minWinRate }
    }

    // Active filter (on related Wallet)
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      walletFilter.isActive = isActive === 'true'
    }

    // Only set wallet filter if there are conditions
    if (Object.keys(walletFilter).length > 0) {
      where.wallet = walletFilter
    }

    // Confidence filter
    if (minConfidence !== undefined || maxConfidence !== undefined) {
      where.confidence = {}
      if (minConfidence !== undefined) where.confidence.gte = minConfidence
      if (maxConfidence !== undefined) where.confidence.lte = maxConfidence
    }

    // Tag filter (comma-separated tags field)
    if (tag) {
      where.tags = { contains: tag }
    }

    // Chain filter
    if (chain) {
      where.preferredChain = chain
    }

    // Blacklist filter
    if (isBlacklisted !== null && isBlacklisted !== undefined && isBlacklisted !== '') {
      where.isBlacklisted = isBlacklisted === 'true'
    }

    // Build order by
    const walletSortFields = ['roi', 'winRate', 'totalPnl', 'totalTrades']
    let orderBy: Prisma.WhaleWalletOrderByWithRelationInput

    if (walletSortFields.includes(sortBy)) {
      orderBy = { wallet: { [sortBy]: sortOrder } }
    } else {
      const sortFieldMap: Record<string, string> = {
        confidence: 'confidence',
        reputation: 'reputation',
        followersCount: 'followersCount',
        createdAt: 'createdAt',
      }
      orderBy = { [sortFieldMap[sortBy] || 'confidence']: sortOrder }
    }

    const [whales, total] = await Promise.all([
      db.whaleWallet.findMany({
        where,
        include: {
          wallet: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      db.whaleWallet.count({ where }),
    ])

    return NextResponse.json({
      data: whales,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching whales:', error)
    return NextResponse.json(
      { error: 'Failed to fetch whale wallets' },
      { status: 500 }
    )
  }
}

// POST /api/whales - Add a whale wallet to tracking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      address,
      label,
      confidence,
      reputation,
      avgHoldingTime,
      preferredChain,
      tags,
    } = body

    if (!address) {
      return NextResponse.json(
        { error: 'Wallet address is required' },
        { status: 400 }
      )
    }

    // Check if wallet already exists
    const existingWallet = await db.wallet.findUnique({
      where: { address },
    })

    let wallet
    if (existingWallet) {
      // Update existing wallet to be a whale
      wallet = await db.wallet.update({
        where: { address },
        data: {
          isWhale: true,
          label: label || existingWallet.label,
        },
      })

      // Check if whale profile already exists
      const existingWhale = await db.whaleWallet.findUnique({
        where: { walletId: wallet.id },
      })

      if (existingWhale) {
        // Update existing whale profile
        const updatedWhale = await db.whaleWallet.update({
          where: { walletId: wallet.id },
          data: {
            confidence: confidence ?? existingWhale.confidence,
            reputation: reputation ?? existingWhale.reputation,
            avgHoldingTime: avgHoldingTime ?? existingWhale.avgHoldingTime,
            preferredChain: preferredChain ?? existingWhale.preferredChain,
            tags: tags ?? existingWhale.tags,
          },
          include: { wallet: true },
        })

        return NextResponse.json({ data: updatedWhale }, { status: 200 })
      }
    } else {
      // Create a placeholder user for this wallet
      const placeholderUser = await db.user.create({
        data: {
          walletAddress: `whale-${address.slice(0, 8)}-${Date.now()}`,
        },
      })

      // Create new wallet
      wallet = await db.wallet.create({
        data: {
          address,
          label: label || null,
          isWhale: true,
          userId: placeholderUser.id,
        },
      })
    }

    // Create whale profile
    const whale = await db.whaleWallet.create({
      data: {
        walletId: wallet.id,
        confidence: confidence ?? 0,
        reputation: reputation ?? 0,
        avgHoldingTime: avgHoldingTime ?? null,
        preferredChain: preferredChain ?? 'solana',
        tags: tags ?? null,
      },
      include: { wallet: true },
    })

    return NextResponse.json({ data: whale }, { status: 201 })
  } catch (error) {
    console.error('Error adding whale wallet:', error)
    return NextResponse.json(
      { error: 'Failed to add whale wallet' },
      { status: 500 }
    )
  }
}
