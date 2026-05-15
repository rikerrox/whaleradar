import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import type { Prisma } from '@prisma/client'

// GET /api/alerts - Fetch alerts for the current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // User ID is required
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
    const type = searchParams.get('type') || '' // whale_buy, whale_sell, volume_spike, new_token, copy_trade
    const isRead = searchParams.get('isRead') // true/false
    const channel = searchParams.get('channel') || '' // browser, telegram, discord, email
    const token = searchParams.get('token') || ''

    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc'

    // Build where clause using Prisma type
    const where: Prisma.AlertWhereInput = { userId }

    if (type) {
      where.type = type
    }

    if (isRead !== null && isRead !== undefined && isRead !== '') {
      where.isRead = isRead === 'true'
    }

    if (channel) {
      where.channel = channel
    }

    if (token) {
      where.token = { contains: token }
    }

    const validSortFields = ['createdAt', 'type', 'isRead', 'channel']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
    const orderBy: Prisma.AlertOrderByWithRelationInput = { [sortField]: sortOrder }

    const [alerts, total] = await Promise.all([
      db.alert.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      db.alert.count({ where }),
    ])

    // Get unread count
    const unreadCount = await db.alert.count({
      where: { userId, isRead: false },
    })

    return NextResponse.json({
      data: alerts,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

// PATCH /api/alerts - Mark alert(s) as read
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId, userId, markAllRead } = body

    // Mark all alerts as read for a user
    if (markAllRead && userId) {
      const result = await db.alert.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      })

      return NextResponse.json({
        message: `Marked ${result.count} alerts as read`,
        count: result.count,
      })
    }

    // Mark a single alert as read
    if (!alertId) {
      return NextResponse.json(
        { error: 'alertId is required (or provide userId with markAllRead)' },
        { status: 400 }
      )
    }

    const alert = await db.alert.findUnique({ where: { id: alertId } })
    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    const updatedAlert = await db.alert.update({
      where: { id: alertId },
      data: { isRead: true },
    })

    return NextResponse.json({ data: updatedAlert })
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    )
  }
}

// DELETE /api/alerts - Delete an alert
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const alertId = searchParams.get('alertId')
    const userId = searchParams.get('userId')
    const deleteAll = searchParams.get('deleteAll') === 'true'

    // Delete all alerts for a user
    if (deleteAll && userId) {
      const result = await db.alert.deleteMany({
        where: { userId },
      })

      return NextResponse.json({
        message: `Deleted ${result.count} alerts`,
        count: result.count,
      })
    }

    // Delete a single alert
    if (!alertId) {
      return NextResponse.json(
        { error: 'alertId is required (or provide userId with deleteAll=true)' },
        { status: 400 }
      )
    }

    const alert = await db.alert.findUnique({ where: { id: alertId } })
    if (!alert) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      )
    }

    await db.alert.delete({ where: { id: alertId } })

    return NextResponse.json({
      message: 'Alert deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting alert:', error)
    return NextResponse.json(
      { error: 'Failed to delete alert' },
      { status: 500 }
    )
  }
}
