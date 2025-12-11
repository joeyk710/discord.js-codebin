import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface SaveVersionRequest {
    files: Array<{ path: string; code: string; language: string }>
    summary?: string
    isAutoSave?: boolean
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params
        const { files, summary, isAutoSave } = (await request.json()) as SaveVersionRequest

        if (!projectId) {
            return NextResponse.json({ error: 'Project ID is required' }, { status: 400 })
        }

        if (!Array.isArray(files) || files.length === 0) {
            return NextResponse.json({ error: 'Files are required' }, { status: 400 })
        }

        // Verify project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        })

        if (!project) {
            console.error(`Project not found for auto-save: ${projectId}`)
            return NextResponse.json({ error: `Project ${projectId} not found` }, { status: 404 })
        }

        // Save each file as a revision
        const revisions = await Promise.all(
            files.map((file) =>
                prisma.fileRevision.create({
                    data: {
                        projectId,
                        filePath: file.path,
                        newContent: file.code,
                        summary: summary || (isAutoSave ? 'Auto-saved' : undefined),
                    },
                })
            )
        )

        // Update project's updatedAt timestamp
        await prisma.project.update({
            where: { id: projectId },
            data: { updatedAt: new Date() },
        })

        return NextResponse.json(
            {
                id: revisions[0]?.id,
                count: revisions.length,
                message: `Saved ${revisions.length} file${revisions.length !== 1 ? 's' : ''}`,
            },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error saving versions:', error instanceof Error ? error.message : error)
        return NextResponse.json({ error: 'Failed to save versions' }, { status: 500 })
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: projectId } = await params
        const { searchParams } = new URL(request.url)
        const filePath = searchParams.get('filePath')

        // Verify project exists
        const project = await prisma.project.findUnique({
            where: { id: projectId },
        })

        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // Fetch revisions for the project or specific file
        const where = filePath
            ? { projectId, filePath }
            : { projectId }

        const revisions = await prisma.fileRevision.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to last 50 revisions
        })

        return NextResponse.json(revisions)
    } catch (error) {
        console.error('Error fetching versions:', error instanceof Error ? error.message : error)
        return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }
}
