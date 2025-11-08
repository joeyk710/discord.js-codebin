import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data', 'pastes')

interface PasteData {
  id: string
  code: string
  title?: string
  description?: string
  language: string
  createdAt: string
  views: number
  isPublic: boolean
}

// Ensure data directory exists
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true })
  } catch (error) {
    console.error('Error creating data directory:', error)
  }
}

async function savePaste(paste: PasteData): Promise<void> {
  await ensureDataDir()
  const filePath = path.join(DATA_DIR, `${paste.id}.json`)
  await fs.writeFile(filePath, JSON.stringify(paste, null, 2))
}

async function readPaste(id: string): Promise<PasteData | null> {
  try {
    const filePath = path.join(DATA_DIR, `${id}.json`)
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch {
    return null
  }
}

async function incrementViews(id: string): Promise<void> {
  const paste = await readPaste(id)
  if (paste) {
    paste.views += 1
    await savePaste(paste)
  }
}

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
    const paste: PasteData = {
      id,
      code,
      title: title || 'Untitled',
      description: description || '',
      language: language || 'javascript',
      createdAt: new Date().toISOString(),
      views: 0,
      isPublic,
    }

    await savePaste(paste)

    return NextResponse.json({
      id: paste.id,
      success: true,
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/paste/${paste.id}`
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

    const paste = await readPaste(id)

    if (!paste) {
      return NextResponse.json(
        { error: 'Paste not found' },
        { status: 404 }
      )
    }

    // Increment views
    await incrementViews(id)
    paste.views += 1

    return NextResponse.json(paste)
  } catch (error) {
    console.error('Error retrieving paste:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Failed to retrieve paste', details: errorMessage },
      { status: 500 }
    )
  }
}