import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// In-memory rate limiting store: Map<browserId, timestamp>
const commentRateLimits = new Map<string, number>()
const RATE_LIMIT_SECONDS = 3 // Same as client-side limit

// Clean up old rate limit entries every 5 minutes to prevent memory leak
setInterval(() => {
    const now = Date.now()
    const maxAge = 5 * 60 * 1000 // 5 minutes

    for (const [browserId, timestamp] of commentRateLimits.entries()) {
        if (now - timestamp > maxAge) {
            commentRateLimits.delete(browserId)
        }
    }
}, 5 * 60 * 1000)

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: projectId } = await params

        // Fetch all comments for this project
        const comments = await prisma.comment.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(comments)
    } catch (error) {
        console.error('Error fetching comments:', error instanceof Error ? error.message : error)
        return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: projectId } = await params
        const { line, filePath, browserId, username, content } = await request.json()

        if (!content || typeof content !== 'string' || content.trim() === '') {
            return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
        }

        if (!username || typeof username !== 'string' || username.trim() === '') {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 })
        }

        // Check rate limiting by browserId
        if (browserId) {
            const lastCommentTime = commentRateLimits.get(browserId)
            const now = Date.now()

            if (lastCommentTime) {
                const secondsSinceLastComment = (now - lastCommentTime) / 1000

                if (secondsSinceLastComment < RATE_LIMIT_SECONDS) {
                    const waitSeconds = Math.ceil(RATE_LIMIT_SECONDS - secondsSinceLastComment)
                    return NextResponse.json(
                        {
                            error: `You're posting too fast. Please wait ${waitSeconds} second${waitSeconds !== 1 ? 's' : ''}`,
                            retryAfter: waitSeconds,
                        },
                        {
                            status: 429,
                            headers: {
                                'Retry-After': waitSeconds.toString(),
                            },
                        }
                    )
                }
            }

            // Update the rate limit timestamp
            commentRateLimits.set(browserId, now)
        }

        // Verify project exists
        const project = await prisma.project.findUnique({ where: { id: projectId } })
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        const comment = await prisma.comment.create({
            data: {
                projectId,
                browserId: browserId || null,
                line: line || null,
                filePath: filePath || null,
                authorName: username.trim() || 'Anonymous',
                content: content.trim(),
            },
        })

        return NextResponse.json(comment, { status: 201 })
    } catch (error) {
        console.error('Error creating comment:', error instanceof Error ? error.message : String(error))
        return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params
        const { commentId } = await request.json()

        if (!commentId) {
            return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
        }

        // Verify comment exists and belongs to this project
        const comment = await prisma.comment.findUnique({
            where: { id: commentId },
        })

        if (!comment || comment.projectId !== projectId) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
        }

        // Delete the comment
        await prisma.comment.delete({
            where: { id: commentId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting comment:', error instanceof Error ? error.message : String(error))
        return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }
}

