import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const referer = request.headers.get('referer') || '/'
    const response = NextResponse.redirect(new URL(referer, request.url))
    response.cookies.delete('discord_session')
    return response
}

export async function POST(request: NextRequest) {
    const referer = request.headers.get('referer') || '/'
    const response = NextResponse.redirect(new URL(referer, request.url))
    response.cookies.delete('discord_session')
    return response
}
