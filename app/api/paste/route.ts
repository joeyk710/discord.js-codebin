import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { createPaste, getPaste, getPublicPastes, type PasteData } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { code, title, description, language = 'javascript', isPublic = true } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid code provided' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const id = nanoid(10)

    // Create paste in database
    const paste = createPaste({
      id,
      code,
      title: title || 'Untitled',
      description: description || '',
      language: language || 'javascript',
      isPublic,
    })

    return NextResponse.json({
      id,
      success: true,
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/paste/${id}`
    })
  } catch (error) {
    console.error('Error saving paste:', error)
    return NextResponse.json(
      { error: 'Failed to save paste' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const list = searchParams.get('list')

    if (list) {
      // List all public pastes
      const pastes = getPublicPastes(50, 0)

      return NextResponse.json({
        pastes: pastes.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          language: p.language,
          createdAt: p.createdAt,
          views: p.views,
        }))
      })
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Paste ID is required' },
        { status: 400 }
      )
    }

    const paste = getPaste(id)

    if (!paste) {
      return NextResponse.json(
        { error: 'Paste not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(paste)
  } catch (error) {
    console.error('Error retrieving paste:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve paste' },
      { status: 500 }
    )
  }
}
