import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// GET /api/tokens - Fetch meme tokens with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))
    const skip = (page - 1) * limit

    // Filtering
    const search = searchParams.get('search') || ''
    const minLiquidity = searchParams.get('minLiquidity')
      ? parseFloat(searchParams.get('minLiquidity')!)
      : undefined
    const maxLiquidity = searchParams.get('maxLiquidity')
      ? parseFloat(searchParams.get('maxLiquidity')!)
      : undefined
    const minVolume24h = searchParams.get('minVolume24h')
      ? parseFloat(searchParams.get('minVolume24h')!)
      : undefined
    const maxVolume24h = searchParams.get('maxVolume24h')
      ? parseFloat(searchParams.get('maxVolume24h')!)
      : undefined
    const minMarketCap = searchParams.get('minMarketCap')
      ? parseFloat(searchParams.get('minMarketCap')!)
      : undefined
    const maxMarketCap = searchParams.get('maxMarketCap')
      ? parseFloat(searchParams.get('maxMarketCap')!)
      : undefined
    const minHolders = searchParams.get('minHolders')
      ? parseInt(searchParams.get('minHolders')!)
      : undefined
    const minWhales = searchParams.get('minWhales')
      ? parseInt(searchParams.get('minWhales')!)
      : undefined
    const maxRugRisk = searchParams.get('maxRugRisk')
      ? parseFloat(searchParams.get('maxRugRisk')!)
      : undefined
    const minTrustScore = searchParams.get('minTrustScore')
      ? parseFloat(searchParams.get('minTrustScore')!)
      : undefined
    const age = searchParams.get('age') || ''
    const chain = searchParams.get('chain') || ''
    const dex = searchParams.get('dex') || ''
    const isTrending = searchParams.get('isTrending')
    const isVerified = searchParams.get('isVerified')
    const priceChangeDirection = searchParams.get('priceChange') || '' // 'up' or 'down'

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'volume24h'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    // Build where clause using Prisma type
    const where: Prisma.TokenWhereInput = {}

    // Search by name, symbol, or address
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { symbol: { contains: search } },
        { address: { contains: search } },
      ]
    }

    // Liquidity filter
    if (minLiquidity !== undefined || maxLiquidity !== undefined) {
      where.liquidity = {}
      if (minLiquidity !== undefined) where.liquidity.gte = minLiquidity
      if (maxLiquidity !== undefined) where.liquidity.lte = maxLiquidity
    }

    // Volume 24h filter
    if (minVolume24h !== undefined || maxVolume24h !== undefined) {
      where.volume24h = {}
      if (minVolume24h !== undefined) where.volume24h.gte = minVolume24h
      if (maxVolume24h !== undefined) where.volume24h.lte = maxVolume24h
    }

    // Market cap filter
    if (minMarketCap !== undefined || maxMarketCap !== undefined) {
      where.marketCap = {}
      if (minMarketCap !== undefined) where.marketCap.gte = minMarketCap
      if (maxMarketCap !== undefined) where.marketCap.lte = maxMarketCap
    }

    // Holders filter
    if (minHolders !== undefined) {
      where.holderCount = { gte: minHolders }
    }

    // Whales filter
    if (minWhales !== undefined) {
      where.whaleCount = { gte: minWhales }
    }

    // Rug risk filter
    if (maxRugRisk !== undefined) {
      where.rugRisk = { lte: maxRugRisk }
    }

    // Trust score filter
    if (minTrustScore !== undefined) {
      where.trustScore = { gte: minTrustScore }
    }

    // Age filter - filter tokens created within a certain time
    if (age) {
      const ageHoursMap: Record<string, number> = {
        '1h': 1,
        '6h': 6,
        '12h': 12,
        '1d': 24,
        '3d': 72,
        '1w': 168,
        '1m': 720,
      }
      const hours = ageHoursMap[age]
      if (hours) {
        where.createdAt = { gte: new Date(Date.now() - hours * 60 * 60 * 1000) }
      }
    }

    // Chain filter
    if (chain) {
      where.chain = chain
    }

    // DEX filter
    if (dex) {
      where.dex = dex
    }

    // Trending filter
    if (isTrending !== null && isTrending !== undefined && isTrending !== '') {
      where.isTrending = isTrending === 'true'
    }

    // Verified filter
    if (isVerified !== null && isVerified !== undefined && isVerified !== '') {
      where.isVerified = isVerified === 'true'
    }

    // Price change direction filter
    if (priceChangeDirection === 'up') {
      where.priceChange24h = { gt: 0 }
    } else if (priceChangeDirection === 'down') {
      where.priceChange24h = { lt: 0 }
    }

    // Valid sort fields
    const validSortFields = [
      'volume24h',
      'marketCap',
      'liquidity',
      'price',
      'priceChange24h',
      'holderCount',
      'whaleCount',
      'rugRisk',
      'trustScore',
      'createdAt',
    ]

    const sortField = validSortFields.includes(sortBy) ? sortBy : 'volume24h'
    const orderBy = { [sortField]: sortOrder }

    const [tokens, total] = await Promise.all([
      db.token.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      db.token.count({ where }),
    ])

    return NextResponse.json({
      data: tokens,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching tokens:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tokens' },
      { status: 500 }
    )
  }
}

// POST /api/tokens - Add a token to watchlist
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, tokenAddress, tokenSymbol } = body

    if (!userId || !tokenAddress || !tokenSymbol) {
      return NextResponse.json(
        { error: 'userId, tokenAddress, and tokenSymbol are required' },
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

    // Check if token exists in DB
    const token = await db.token.findUnique({ where: { address: tokenAddress } })
    if (!token) {
      return NextResponse.json(
        { error: 'Token not found in database. Add the token first.' },
        { status: 404 }
      )
    }

    // Check if already on watchlist
    const existing = await db.watchlist.findUnique({
      where: {
        userId_tokenAddress: { userId, tokenAddress },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Token already on watchlist', data: existing },
        { status: 409 }
      )
    }

    const watchlistEntry = await db.watchlist.create({
      data: {
        userId,
        tokenAddress,
        tokenSymbol,
      },
    })

    return NextResponse.json({ data: watchlistEntry }, { status: 201 })
  } catch (error) {
    console.error('Error adding token to watchlist:', error)
    return NextResponse.json(
      { error: 'Failed to add token to watchlist' },
      { status: 500 }
    )
  }
}
