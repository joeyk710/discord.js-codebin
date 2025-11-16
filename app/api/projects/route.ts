import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { randomUUID } from 'crypto'

export async function POST(request: NextRequest) {
    try {
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
            // Generate a secure deletion token for this project
            const deletionToken = randomUUID()

            const project = await prisma.project.create({
                data: {
                    title: title,
                    description: description || '',
                    isPublic: isPublic,
                    expiresAt: expiresAt,
                    deletionToken: deletionToken,
                    files: (files.map((file: any) => ({
                        id: randomUUID(),
                        path: file.path,
                        name: file.path.split('/').pop() || file.path,
                        code: file.code,
                        language: file.language || 'javascript',
                    }))) as any,
                },
            })

            const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000'

            // Return the deletion token only on creation so the client can store it locally.
            return NextResponse.json({
                id: project.id,
                success: true,
                shortUrl: `${origin}/project/${project.id}`,
                project,
                deletionToken,
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

            // Increment views
            await prisma.project.update({
                where: { id },
                data: { views: { increment: 1 } },
            })

            return NextResponse.json({
                ...project,
                views: project.views + 1,
            })
        }

        // Paginated listing path (safe numeric parsing to avoid quoted OFFSET)
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
            if (isPublicParam === 'true' || isPublicParam === '1') where.isPublic = true
            else if (isPublicParam === 'false' || isPublicParam === '0') where.isPublic = false
        }

        const total = await prisma.project.count({ where })
        const items = await prisma.project.findMany({
            where,
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
