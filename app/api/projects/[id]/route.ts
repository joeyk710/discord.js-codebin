import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type RouteParams = {
    id: string
}

export async function PUT(
    request: NextRequest,
    { params }: { params: RouteParams }
) {
    try {
        const { id } = params
        const { title, description, isPublic } = await request.json()

        const project = await prisma.project.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description !== undefined && { description }),
                ...(isPublic !== undefined && { isPublic }),
                updatedAt: new Date(),
            },
            include: {
                projectFiles: true,
            },
        })

        return NextResponse.json({
            success: true,
            project,
        })
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
    { params }: { params: RouteParams }
) {
    try {
        const { id } = params
        const { searchParams } = new URL(request.url)
        const token = searchParams.get('token')

        if (!token || token !== id) {
            return NextResponse.json(
                { error: 'Not authorized to delete this project' },
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
