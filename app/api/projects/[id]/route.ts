import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createHash } from 'crypto'

type RouteParams = {
    id: string
}

const API_TOKEN = process.env.API_TOKEN || 'default-unsafe-token'

function verifyToken(request: NextRequest): boolean {
    const authHeader = request.headers.get('Authorization')
    const tokenFromHeader = authHeader?.replace('Bearer ', '')
    const { searchParams } = new URL(request.url)
    const tokenFromQuery = searchParams.get('token')
    const providedToken = tokenFromHeader || tokenFromQuery
    if (!providedToken) return false
    return providedToken === API_TOKEN
}

function hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
}

function verifyDeletionMatch(providedToken: string | null | undefined, storedToken: string | null | undefined) {
    if (!providedToken || !storedToken) return false
    const isHashed = /^[0-9a-f]{64}$/.test(storedToken)
    if (isHashed) return hashToken(providedToken) === storedToken
    return providedToken === storedToken
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<RouteParams> }
) {
    try {
        const { id } = await params

        // Require either the project's deletion token (owner) or the API admin token to update
        const { searchParams } = new URL(request.url)
        const authHeader = request.headers.get('Authorization')
        const tokenFromHeader = authHeader?.replace('Bearer ', '')
        const token = tokenFromHeader || searchParams.get('token')

        const existing = await prisma.project.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        const hasApiToken = verifyToken(request)
        const hasDeletionToken = verifyDeletionMatch(token, existing.deletionToken)

        if (!hasApiToken && !hasDeletionToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { title, description, isPublic } = await request.json()

        const project = await prisma.project.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(isPublic !== undefined && { isPublic }),
                updatedAt: new Date(),
            },
        })

        return NextResponse.json({ success: true, project })
    } catch (error) {
        console.error('Error updating project:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return NextResponse.json(
            { error: 'Failed to update project', details: errorMessage },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<RouteParams> }
) {
    try {
        const { id } = await params

        const { searchParams } = new URL(request.url)
        const authHeader = request.headers.get('Authorization')
        const tokenFromHeader = authHeader?.replace('Bearer ', '')
        const token = tokenFromHeader || searchParams.get('token')

        // If Turnstile is configured, require and verify the Turnstile token
        const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET
        if (TURNSTILE_SECRET) {
            const turnstileToken = request.headers.get('cf-turnstile-token') || request.headers.get('CF-Turnstile-Token')
            if (!turnstileToken) {
                return NextResponse.json({ error: 'CAPTCHA required' }, { status: 400 })
            }

            // Verify with Cloudflare
            try {
                const form = new URLSearchParams()
                form.append('secret', TURNSTILE_SECRET)
                form.append('response', turnstileToken)

                const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: form.toString(),
                })

                const verifyJson = await verifyRes.json()
                if (!verifyJson.success) {
                    return NextResponse.json({ error: 'CAPTCHA verification failed', details: verifyJson }, { status: 403 })
                }
            } catch (e) {
                console.error('Turnstile verification error:', e)
                return NextResponse.json({ error: 'CAPTCHA verification error' }, { status: 500 })
            }
        }

        // Verify deletion token matches the stored token for this project
        const existing = await prisma.project.findUnique({ where: { id } })
        if (!existing) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        if (!existing.deletionToken || !verifyDeletionMatch(token, existing.deletionToken)) {
            return NextResponse.json(
                { error: 'Invalid deletion token' },
                { status: 403 }
            )
        }

        const project = await prisma.project.delete({
            where: { id },
        })

        return NextResponse.json({
            success: true,
            message: 'Project deleted successfully',
            id: project.id,
        })
    } catch (error) {
        console.error('Error deleting project:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return NextResponse.json(
            { error: 'Failed to delete project', details: errorMessage },
            { status: 500 }
        )
    }
}
