import { NextResponse } from 'next/server'
import { getRelevantExamplesForText } from '@/lib/discordJsDocFetcher'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const text = typeof body.text === 'string' ? body.text : ''

    const examples = await getRelevantExamplesForText(text)
    return NextResponse.json({ ok: true, examples })
  } catch (error) {
    console.error('Error in /api/docs:', error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
