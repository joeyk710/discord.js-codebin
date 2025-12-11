import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
    const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI
    const SCOPES = 'identify email'

    console.log('=== Discord Login Route ===')
    console.log('DISCORD_CLIENT_ID:', DISCORD_CLIENT_ID)
    console.log('DISCORD_REDIRECT_URI:', REDIRECT_URI)

    // Get the referer URL to redirect back after login
    const referer = request.headers.get('referer') || '/'
    const state = Buffer.from(referer).toString('base64')

    const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(
        REDIRECT_URI!
    )}&response_type=code&scope=${encodeURIComponent(SCOPES)}&state=${encodeURIComponent(state)}`

    console.log('Full Auth URL:', discordAuthUrl)

    return NextResponse.redirect(discordAuthUrl)
}
