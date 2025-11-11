import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { code, title, description, language = 'javascript', isPublic = true, expirationMinutes } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid code provided' },
        { status: 400 }
      )
    }

    // Calculate expiration date
    let expiresAt = new Date()
    if (expirationMinutes && expirationMinutes >= 5) {
      // Use provided expiration (capped at reasonable max)
      expiresAt.setMinutes(expiresAt.getMinutes() + Math.min(expirationMinutes, 10080)) // Max 7 days
    } else {
      // Default to 7 days if not specified
      expiresAt.setDate(expiresAt.getDate() + 7)
    }

    const id = nanoid(8)
    const paste = await prisma.paste.create({
      data: {
        id,
        code,
        title: title || 'Untitled',
        description: description || '',
        language: language || 'javascript',
        isPublic,
        expiresAt,
      },
    })

    // Get the origin from the request headers
    const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000'

    return NextResponse.json({
      id: paste.id,
      success: true,
      shortUrl: `${origin}/paste/${paste.id}`
    })
  } catch (error) {
    console.error('Error saving paste:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Failed to save paste', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Paste ID is required' },
        { status: 400 }
      )
    }

    const paste = await prisma.paste.findUnique({
      where: { id },
    })

    if (!paste) {
      return NextResponse.json(
        { error: 'Paste not found' },
        { status: 404 }
      )
    }

    // Check if paste has expired
    if (paste.expiresAt && new Date() > paste.expiresAt) {
      return NextResponse.json(
        { error: 'This paste has expired' },
        { status: 404 }
      )
    }

    // Increment views
    await prisma.paste.update({
      where: { id },
      data: { views: { increment: 1 } },
    })

    return NextResponse.json({
      ...paste,
      views: paste.views + 1,
    })
  } catch (error) {
    console.error('Error retrieving paste:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Failed to retrieve paste', details: errorMessage },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const token = searchParams.get('token')

    if (!id) {
      return NextResponse.json(
        { error: 'Paste ID is required' },
        { status: 400 }
      )
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Not authorized to delete this paste' },
        { status: 401 }
      )
    }

    // Verify token matches the paste ID (simple ownership check)
    // Token should be the paste ID sent from client to prove they have it
    // In a real app, you'd want more sophisticated token verification
    if (token !== id) {
      return NextResponse.json(
        { error: 'Invalid deletion token' },
        { status: 403 }
      )
    }

    const paste = await prisma.paste.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Paste deleted successfully',
      id: paste.id,
    })
  } catch (error) {
    console.error('Error deleting paste:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Failed to delete paste', details: errorMessage },
      { status: 500 }
    )
  }
}