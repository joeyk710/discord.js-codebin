import { NextRequest, NextResponse } from 'next/server'

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    // Check for Discord OAuth errors
    if (error) {
        console.error('Discord OAuth error:', error, errorDescription)
        return NextResponse.redirect(new URL(`/?error=discord_oauth&details=${encodeURIComponent(error)}: ${encodeURIComponent(errorDescription || '')}`, request.url))
    }

    console.log('OAuth callback initiated')
    console.log('Code:', code)
    console.log('State:', state)
    console.log('DISCORD_CLIENT_ID:', DISCORD_CLIENT_ID)
    console.log('REDIRECT_URI:', REDIRECT_URI)

    if (!code) {
        console.error('No code provided')
        return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    // Decode the state to get the original URL
    let returnUrl = '/'
    if (state) {
        try {
            returnUrl = Buffer.from(state, 'base64').toString('utf-8')
            console.log('Decoded returnUrl:', returnUrl)
        } catch (e) {
            console.error('Failed to decode state:', e)
        }
    }

    try {
        // Exchange code for access token using HTTP Basic Auth
        const basicAuth = Buffer.from(`${DISCORD_CLIENT_ID}:${DISCORD_CLIENT_SECRET}`).toString('base64')
        console.log('Exchanging code for token...')
        const tokenResponse = await fetch('https://discord.com/api/v10/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Basic ${basicAuth}`,
            },
            body: new URLSearchParams({
                grant_type: 'authorization_code',
                code,
                redirect_uri: REDIRECT_URI!,
            }).toString(),
        })

        console.log('Token response status:', tokenResponse.status)

        if (!tokenResponse.ok) {
            const error = await tokenResponse.text()
            console.error('Token exchange error:', error)
            return NextResponse.redirect(new URL(`${returnUrl}?error=token_exchange_failed`, request.url))
        }

        const tokenData = await tokenResponse.json()
        const accessToken = tokenData.access_token
        console.log('Got access token:', accessToken ? 'Yes' : 'No')

        // Get user info from Discord
        console.log('Fetching user info from Discord...')
        const userResponse = await fetch('https://discord.com/api/v10/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        })

        console.log('User response status:', userResponse.status)

        if (!userResponse.ok) {
            const error = await userResponse.text()
            console.error('User fetch error:', error)
            return NextResponse.redirect(new URL(`${returnUrl}?error=user_fetch_failed`, request.url))
        }

        const discordUser = await userResponse.json()
        console.log('Discord user:', discordUser)

        // Create session data with user info
        const sessionData = {
            userId: discordUser.id,
            username: discordUser.username,
            avatar: discordUser.avatar,
            email: discordUser.email,
            discriminator: discordUser.discriminator,
        }

        const sessionToken = Buffer.from(JSON.stringify(sessionData)).toString('base64')

        console.log('Discord OAuth successful:', sessionData)

        const response = NextResponse.redirect(new URL(returnUrl, request.url))
        response.cookies.set('discord_session', sessionToken, {
            httpOnly: false, // Allow client to read for hook polling
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        })

        console.log('Cookie set on response')
        return response
    } catch (error) {
        console.error('OAuth callback error:', error)
        return NextResponse.redirect(new URL(`${returnUrl}?error=internal_error`, request.url))
    }
}
