import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { randomUUID, createHash } from 'crypto'

// API token for protecting endpoints (set via environment variable)
const API_TOKEN = process.env.API_TOKEN || 'default-unsafe-token'

// Helper to verify API token from Authorization header or query param
function verifyToken(request: NextRequest): boolean {
    const authHeader = request.headers.get('Authorization')
    const tokenFromHeader = authHeader?.replace('Bearer ', '')
    const { searchParams } = new URL(request.url)
    const tokenFromQuery = searchParams.get('token')

    const providedToken = tokenFromHeader || tokenFromQuery

    if (!providedToken) {
        return false
    }

    return providedToken === API_TOKEN
}

function hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex')
}

function verifyDeletionMatch(providedToken: string | null | undefined, storedToken: string | null | undefined) {
    if (!providedToken || !storedToken) return false
    // If stored token looks like a sha256 hex digest, compare hashed provided token
    const isHashed = /^[0-9a-f]{64}$/.test(storedToken)
    if (isHashed) {
        return hashToken(providedToken) === storedToken
    }
    // fallback to plaintext comparison for existing entries
    return providedToken === storedToken
}

export async function POST(request: NextRequest) {
    try {
        // Allow public creation so users can save/share projects without an API token.
        // (Listing and admin endpoints remain protected.)
        const { title, description, files, isPublic = true, expirationDays } = await request.json()

        console.log('POST /api/projects - Request body:', { title, description, filesCount: files?.length, isPublic })

        if (!title || typeof title !== 'string' || title.trim() === '') {
            return NextResponse.json(
                { error: 'Invalid title provided. Title must be a non-empty string.' },
                { status: 400 }
            )
        }

        if (!Array.isArray(files) || files.length === 0) {
            return NextResponse.json(
                { error: 'Project must contain at least one file' },
                { status: 400 }
            )
        }

        // Validate file structure
        for (const file of files) {
            if (!file.path || file.code === undefined || file.code === null) {
                return NextResponse.json(
                    { error: 'Each file must have a path and code' },
                    { status: 400 }
                )
            }
        }

        // Calculate expiration date if provided
        let expiresAt: Date | null = null
        if (expirationDays && typeof expirationDays === 'number' && expirationDays > 0) {
            expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + Math.min(expirationDays, 7)) // Max 7 days
        }

        try {
            // Generate a secure deletion token for this project (return raw to client, store hashed)
            const deletionTokenRaw = randomUUID()
            const deletionTokenHashed = hashToken(deletionTokenRaw)

            const project = await prisma.project.create({
                data: {
                    title: title,
                    description: description || '',
                    isPublic: isPublic,
                    expiresAt: expiresAt,
                    deletionToken: deletionTokenHashed,
                    files: (files.map((file) => ({
                        id: randomUUID(),
                        path: file.path,
                        name: file.path.split('/').pop() || file.path,
                        code: file.code,
                        language: file.language || 'javascript',
                    }))),
                },
            })

            // Log the created project id for debugging / dedupe checks
            console.log('Created project id:', project.id)

            const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000'

            // Return the raw deletion token only on creation so the client can store it locally.
            return NextResponse.json({
                id: project.id,
                success: true,
                shortUrl: `${origin}/project/${project.id}`,
                project,
                deletionToken: deletionTokenRaw,
            })
        } catch (dbError) {
            console.error('Database error:', dbError)

            // Check for connection errors
            if (dbError instanceof Error) {
                if (dbError.message.includes('P6008') || dbError.message.includes('Can\'t reach database')) {
                    return NextResponse.json(
                        {
                            error: 'Database connection failed',
                            message: 'Unable to connect to database. Please check DATABASE_URL is set correctly or try again later.',
                            details: dbError.message
                        },
                        { status: 503 }
                    )
                }

                if (dbError.message.includes('ECONNREFUSED')) {
                    return NextResponse.json(
                        {
                            error: 'Database connection refused',
                            message: 'Database server is not running or unreachable.',
                            details: dbError.message
                        },
                        { status: 503 }
                    )
                }
            }

            throw dbError
        }
    } catch (error) {
        console.error('Error creating project:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)

        // Check for database connectivity issues
        if (errorMessage.includes('P6008') || errorMessage.includes('Can\'t reach database')) {
            return NextResponse.json(
                {
                    error: 'Database connection failed',
                    message: 'Unable to connect to database. Please check your database configuration.',
                    details: errorMessage
                },
                { status: 503 }
            )
        }

        // Log more details for debugging
        if (error instanceof Error && error.message.includes('ECONNREFUSED')) {
            return NextResponse.json(
                {
                    error: 'Database connection refused',
                    message: 'Database server is not running. Please start your database.',
                    details: errorMessage
                },
                { status: 503 }
            )
        }

        return NextResponse.json(
            {
                error: 'Failed to create project',
                message: errorMessage,
                details: errorMessage,
            },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')
        // If an `id` query param is provided return single project, otherwise return a paginated list
        if (id) {
            const project = await prisma.project.findUnique({
                where: { id },
            })

            if (!project) {
                return NextResponse.json(
                    { error: 'Project not found' },
                    { status: 404 }
                )
            }

            // Check if project has expired
            if (project.expiresAt && new Date() > project.expiresAt) {
                return NextResponse.json(
                    { error: 'This project has expired' },
                    { status: 404 }
                )
            }
            // If the project is public, allow unauthenticated viewing. Otherwise require a valid token
            // - valid API token (verifyToken)
            // - OR the project's deletionToken passed as ?token=DELETION_TOKEN
            if (!project.isPublic) {
                const { searchParams: sp } = new URL(request.url)
                const token = sp.get('token')
                const authHeader = request.headers.get('Authorization')
                const tokenFromHeader = authHeader?.replace('Bearer ', '')
                const providedToken = tokenFromHeader || token
                const hasApiToken = verifyToken(request)
                const hasDeletionToken = verifyDeletionMatch(providedToken, project.deletionToken)

                if (!hasApiToken && !hasDeletionToken) {
                    return NextResponse.json({ error: 'Unauthorized: private project' }, { status: 401 })
                }
            }

            // Increment views only once per unique browser (tracked via cookie)
            const response = NextResponse.json(project)

            // Set a cookie to track this view as coming from this browser
            // The cookie is set for this specific project ID
            const viewCookieName = `viewed_${id}`
            const existingCookie = request.cookies.get(viewCookieName)

            if (!existingCookie) {
                // First view from this browser - increment the counter
                await prisma.project.update({ where: { id }, data: { views: { increment: 1 } } })
                // Set cookie to expire in 24 hours
                response.cookies.set(viewCookieName, 'true', {
                    maxAge: 24 * 60 * 60, // 24 hours
                    path: '/',
                })
            }

            return response
        }

        // Paginated listing path - REQUIRE API TOKEN
        const hasApiToken = verifyToken(request)
        if (!hasApiToken) {
            return NextResponse.json(
                { error: 'Unauthorized: listing projects requires an API token' },
                { status: 403 }
            )
        }

        const rawLimit = searchParams.get('limit')
        const rawOffset = searchParams.get('offset') || searchParams.get('page')

        const limit = Math.max(1, Math.min(100, parseInt(rawLimit || '25', 10) || 25))
        // support page or offset; if page provided treat as offset
        const offset = Math.max(0, parseInt(rawOffset || '0', 10) || 0)

        // allow optional isPublic filter
        const isPublicParam = searchParams.get('isPublic')
        const where: any = {}

        if (isPublicParam !== null) {
            // coerce to boolean if possible
            if (isPublicParam === 'true' || isPublicParam === '1') {
                where.isPublic = true
            } else if (isPublicParam === 'false' || isPublicParam === '0') {
                where.isPublic = false
            }
        }

        const total = await prisma.project.count({ where })
        const items = await prisma.project.findMany({
            where,
            select: {
                id: true,
                title: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                views: true,
                isPublic: true,
                expiresAt: true,
                // Exclude 'files' from listing to avoid response size limit
            },
            orderBy: { createdAt: 'desc' },
            skip: offset,
            take: limit,
        })

        return NextResponse.json({ total, items })
    } catch (error) {
        console.error('Error retrieving project:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return NextResponse.json(
            { error: 'Failed to retrieve project', details: errorMessage },
            { status: 500 }
        )
    }
}
