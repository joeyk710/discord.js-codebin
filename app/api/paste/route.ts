import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'pastes')

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating data directory:', error)
  }
}

export interface PasteData {
  id: string
  code: string
  title?: string
  description?: string
  language: 'javascript' | 'typescript' | 'json'
  createdAt: string
  views: number
  isPublic: boolean
}

export async function POST(request: NextRequest) {
  try {
    await ensureDataDir()

    const { code, title, description, language = 'javascript', isPublic = true } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Invalid code provided' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const id = nanoid(10)

    // Save paste to file system
    const filePath = path.join(DATA_DIR, `${id}.json`)
    const pasteData: PasteData = {
      id,
      code,
      title: title || 'Untitled',
      description: description || '',
      language: language || 'javascript',
      createdAt: new Date().toISOString(),
      views: 0,
      isPublic,
    }

    await fs.writeFile(filePath, JSON.stringify(pasteData, null, 2))

    return NextResponse.json({ id, success: true, shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/paste/${id}` })
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
      await ensureDataDir()
      const files = await fs.readdir(DATA_DIR)
      const pastes = []

      for (const file of files) {
        if (file.endsWith('.json')) {
          try {
            const data = await fs.readFile(path.join(DATA_DIR, file), 'utf-8')
            const pasteData: PasteData = JSON.parse(data)
            if (pasteData.isPublic) {
              pastes.push({
                id: pasteData.id,
                title: pasteData.title,
                description: pasteData.description,
                language: pasteData.language,
                createdAt: pasteData.createdAt,
                views: pasteData.views,
              })
            }
          } catch (e) {
            console.error('Error reading paste:', e)
          }
        }
      }

      // Sort by creation date (newest first)
      pastes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      return NextResponse.json({ pastes: pastes.slice(0, 50) }) // Limit to 50
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Paste ID is required' },
        { status: 400 }
      )
    }

    const filePath = path.join(DATA_DIR, `${id}.json`)

    try {
      const data = await fs.readFile(filePath, 'utf-8')
      const pasteData: PasteData = JSON.parse(data)

      // Increment views
      pasteData.views = (pasteData.views || 0) + 1
      await fs.writeFile(filePath, JSON.stringify(pasteData, null, 2))

      return NextResponse.json(pasteData)
    } catch (error) {
      return NextResponse.json(
        { error: 'Paste not found' },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error retrieving paste:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve paste' },
      { status: 500 }
    )
  }
}
