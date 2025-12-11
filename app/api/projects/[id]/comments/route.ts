import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: projectId } = await params

        // Fetch all comments for this project
        const comments = await prisma.comment.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
            include: {
                user: true,
            },
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
        const { line, filePath, userId, username, avatar, content } = await request.json()

        if (!content || typeof content !== 'string' || content.trim() === '') {
            return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
        }

        // Verify project exists
        const project = await prisma.project.findUnique({ where: { id: projectId } })
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // If userId provided, create user if doesn't exist
        if (userId) {
            try {
                await prisma.user.upsert({
                    where: { discordId: userId },
                    update: {
                        username,
                        avatar,
                    },
                    create: {
                        id: userId,
                        discordId: userId,
                        username,
                        avatar,
                    },
                })
            } catch (userError) {
                // Log but continue - comment can still be created even if user upsert fails
                console.error('User upsert error:', userError instanceof Error ? userError.message : String(userError))
            }
        }

        const comment = await prisma.comment.create({
            data: {
                projectId,
                userId: userId || null,
                line: line || null,
                filePath: filePath || null,
                authorName: username || 'Anonymous',
                content: content.trim(),
            },
            include: {
                user: true,
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

