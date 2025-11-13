import { Metadata } from 'next'

interface ProjectData {
    id: string
    title: string
    description: string | null
    files?: any
    createdAt: string
    views: number
    isPublic: boolean
}

interface Props {
    params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    try {
        const { id } = await params
        const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://discord-js-codebin.vercel.app'

        const response = await fetch(`${baseUrl}/api/projects?id=${id}`, {
            next: { revalidate: 60 } // Cache for 60 seconds
        })
        if (!response.ok) {
            return {
                title: 'Project Not Found',
                description: 'The requested project could not be found',
            }
        }

        const project: ProjectData = await response.json()

        const title = project.title || 'discord.js Code Project'
        const description = project.description || 'View and analyze discord.js code project'

        return {
            title,
            description,
            openGraph: {
                title,
                description,
                type: 'website',
                url: `${baseUrl}/project/${id}`,
                images: [
                    {
                        url: '/djs.png',
                        width: 1200,
                        height: 630,
                        alt: 'discord.js Code Bin',
                    },
                ],
                siteName: 'discord.js Code Bin',
            },
            twitter: {
                card: 'summary_large_image',
                title,
                description,
                images: ['/djs.png'],
            },
        }
    } catch (error) {
        return {
            title: 'discord.js Code Bin',
            description: 'View and analyze discord.js code',
        }
    }
}

export default function ProjectLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
