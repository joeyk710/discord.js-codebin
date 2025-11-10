import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

type RouteParams = {
    id: string
}

interface FileData {
    id: string
    path: string
    name: string
    code: string
    language: string
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

        // Verify project exists and get current files
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
        const files = ((project.files as unknown) as FileData[]) || []

        // Check if file already exists
        const existingFileIndex = files.findIndex(f => f.path === path)

        if (existingFileIndex >= 0) {
            // Update existing file
            files[existingFileIndex] = {
                ...files[existingFileIndex],
                code,
                language,
            }
        } else {
            // Add new file
            files.push({
                id: crypto.randomUUID(),
                path,
                name: fileName,
                code,
                language,
            })
        }

        // Update project with new files array
        const updatedProject = await prisma.project.update({
            where: { id },
            data: {
                files: files as any,
                updatedAt: new Date(),
            },
        })

        const updatedFile = files.find(f => f.path === path)

        return NextResponse.json({
            success: true,
            file: updatedFile,
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

        // Verify project exists and get current files
        const project = await prisma.project.findUnique({
            where: { id },
        })

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
                { status: 404 }
            )
        }

        const files = (project.files as unknown as FileData[]) || []

        // Prevent deletion if it's the only file
        if (files.length <= 1) {
            return NextResponse.json(
                { error: 'Cannot delete the last file in a project' },
                { status: 400 }
            )
        }

        // Remove the file
        const updatedFiles = files.filter(f => f.path !== filePath)

        // Update project
        const updatedProject = await prisma.project.update({
            where: { id },
            data: {
                files: updatedFiles as any,
                updatedAt: new Date(),
            },
        })

        return NextResponse.json({
            success: true,
            message: 'File deleted successfully',
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
