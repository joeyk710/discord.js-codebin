import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type RouteParams = {
    id: string
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<RouteParams> }
) {
    try {
        const { id } = await params
        const { path, code, language = 'javascript' } = await request.json()

        if (!path || !code) {
            return NextResponse.json(
                { error: 'Path and code are required' },
                { status: 400 }
            )
        }

        // Verify project exists
        const project = await prisma.project.findUnique({
            where: { id },
        })

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        const fileName = path.split('/').pop() || path

        // Use upsert to create or update file
        const file = await prisma.projectFile.upsert({
            where: {
                projectId_path: {
                    projectId: id,
                    path,
                },
            },
            create: {
                projectId: id,
                path,
                name: fileName,
                code,
                language,
            },
            update: {
                code,
                language,
            },
        })

        // Update project updatedAt
        await prisma.project.update({
            where: { id },
            data: { updatedAt: new Date() },
        })

        return NextResponse.json({
            success: true,
            file,
        })
    } catch (error) {
        console.error('Error creating/updating file:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return NextResponse.json(
            { error: 'Failed to create/update file', details: errorMessage },
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
        const filePath = searchParams.get('path')

        if (!filePath) {
            return NextResponse.json(
                { error: 'File path is required' },
                { status: 400 }
            )
        }

        // Verify project exists
        const project = await prisma.project.findUnique({
            where: { id },
            include: { projectFiles: true },
        })

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        // Prevent deletion if it's the only file
        if (project.projectFiles.length <= 1) {
            return NextResponse.json(
                { error: 'Cannot delete the last file in a project' },
                { status: 400 }
            )
        }

        const deleted = await prisma.projectFile.delete({
            where: {
                projectId_path: {
                    projectId: id,
                    path: filePath,
                },
            },
        })

        // Update project updatedAt
        await prisma.project.update({
            where: { id },
            data: { updatedAt: new Date() },
        })

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
            fileId: deleted.id,
        })
    } catch (error) {
        console.error('Error deleting file:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return NextResponse.json(
            { error: 'Failed to delete file', details: errorMessage },
            { status: 500 }
        )
    }
}
