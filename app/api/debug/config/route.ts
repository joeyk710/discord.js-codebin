import { NextResponse } from 'next/server'

export async function GET() {
    // Only expose in development or if explicitly allowed
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }

    return NextResponse.json({
        DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ? '✓ Set' : '✗ Missing',
        DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ? '✓ Set' : '✗ Missing',
        DISCORD_REDIRECT_URI: process.env.DISCORD_REDIRECT_URI || '✗ Missing',
        NODE_ENV: process.env.NODE_ENV,
    })
}
