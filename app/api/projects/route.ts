import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
    try {
        const { title, description, files, isPublic = true } = await request.json()

        if (!title || typeof title !== 'string') {
            return NextResponse.json(
                { error: 'Invalid title provided' },
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
            if (!file.path || !file.code) {
                return NextResponse.json(
                    { error: 'Each file must have a path and code' },
                    { status: 400 }
                )
            }
        }

        const project = await prisma.project.create({
            data: {
                title: title,
                description: description || '',
                isPublic: isPublic,
                projectFiles: {
                    create: files.map((file: any) => ({
                        path: file.path,
                        name: file.path.split('/').pop() || file.path,
                        code: file.code,
                        language: file.language || 'javascript',
                    })),
                },
            },
            include: {
                projectFiles: true,
            },
        })

        const origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'http://localhost:3000'

        return NextResponse.json({
            id: project.id,
            success: true,
            shortUrl: `${origin}/project/${project.id}`,
            project,
        })
    } catch (error) {
        console.error('Error creating project:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return NextResponse.json(
            { error: 'Failed to create project', details: errorMessage },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const id = searchParams.get('id')

        if (!id) {
            return NextResponse.json(
                { error: 'Project ID is required' },
                { status: 400 }
            )
        }

        const project = await prisma.project.findUnique({
            where: { id },
            include: {
                projectFiles: {
                    orderBy: { createdAt: 'asc' },
                },
            },
        })

        if (!project) {
            return NextResponse.json(
                { error: 'Project not found' },
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
    } catch (error) {
        console.error('Error retrieving project:', error)
        const errorMessage = error instanceof Error ? error.message : String(error)
        return NextResponse.json(
            { error: 'Failed to retrieve project', details: errorMessage },
            { status: 500 }
        )
    }
}
