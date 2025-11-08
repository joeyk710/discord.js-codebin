import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const { code, title, description, language = 'javascript', isPublic = true } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid code provided' },
        { status: 400 }
      )
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