import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    // Get all cookies
    const cookies = request.cookies.getAll()
    const discordSessionCookie = request.cookies.get('discord_session')

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        allCookies: cookies.map(c => ({ name: c.name, length: c.value.length })),
        discordSessionCookie: discordSessionCookie ? {
            exists: true,
            length: discordSessionCookie.value.length,
            preview: discordSessionCookie.value.substring(0, 50) + '...'
        } : {
            exists: false
        }
    })
}
