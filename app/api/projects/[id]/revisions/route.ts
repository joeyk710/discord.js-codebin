import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateDiff, getDiffSummary } from '@/lib/diffUtils'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: projectId } = await params
        const { searchParams } = new URL(request.url)
        const filePath = searchParams.get('filePath')

        // Fetch revisions for a project, optionally filtered by file path
        const where = { projectId, ...(filePath && { filePath }) }
        const revisions = await (prisma as any).fileRevision.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 50, // Limit to recent revisions
        })

        return NextResponse.json(revisions)
    } catch (error) {
        console.error('Error fetching revisions:', error)
        return NextResponse.json({ error: 'Failed to fetch revisions' }, { status: 500 })
    }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: projectId } = await params
        const { filePath, previousContent, newContent, summary } = await request.json()

        if (!filePath || !newContent) {
            return NextResponse.json(
                { error: 'filePath and newContent are required' },
                { status: 400 }
            )
        }

        // Verify project exists
        const project = await prisma.project.findUnique({ where: { id: projectId } })
        if (!project) {
            return NextResponse.json({ error: 'Project not found' }, { status: 404 })
        }

        // Generate summary if not provided
        const autoSummary = summary || getDiffSummary(previousContent, newContent)

        const revision = await (prisma as any).fileRevision.create({
            data: {
                projectId,
                filePath,
                previousContent: previousContent || null,
                newContent,
                summary: autoSummary,
            },
        })

        return NextResponse.json(revision, { status: 201 })
    } catch (error) {
        console.error('Error creating revision:', error)
        return NextResponse.json({ error: 'Failed to create revision' }, { status: 500 })
    }
}

/**
 * GET /api/projects/[id]/revisions/diff?filePath=...
 * Returns the diff between the current file and its previous version
 */
export async function GET_DIFF(request: NextRequest, { params }: { params: { id: string } }) {
    try {
        const projectId = params.id
        const { searchParams } = new URL(request.url)
        const filePath = searchParams.get('filePath')

        if (!filePath) {
            return NextResponse.json({ error: 'filePath is required' }, { status: 400 })
        }

        // Get the most recent revision for this file
        const latestRevision = await (prisma as any).fileRevision.findFirst({
            where: { projectId, filePath },
            orderBy: { createdAt: 'desc' },
        })

        if (!latestRevision) {
            return NextResponse.json({ error: 'No revisions found for this file' }, { status: 404 })
        }

        // Generate diff
        const diff = generateDiff(latestRevision.previousContent, latestRevision.newContent)

        return NextResponse.json({
            filePath,
            diff,
            summary: latestRevision.summary,
            createdAt: latestRevision.createdAt,
        })
    } catch (error) {
        console.error('Error generating diff:', error)
        return NextResponse.json({ error: 'Failed to generate diff' }, { status: 500 })
    }
}
