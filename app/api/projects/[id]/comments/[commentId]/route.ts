import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; commentId: string }> }
) {
    try {
        const { id: projectId, commentId } = await params
        const { browserId } = await request.json()

        if (!commentId) {
            return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
        }

        // Verify project exists
        const project = await prisma.project.findUnique({ where: { id: projectId } })
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // Find and delete the comment
        const comment = await (prisma as any).comment.findUnique({
            where: { id: commentId },
        })

        if (!comment) {
            return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
        }

        if (comment.projectId !== projectId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Delete the comment
        await (prisma as any).comment.delete({
            where: { id: commentId },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting comment:', error)
        return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }
}
