import { Metadata } from 'next'

interface PasteData {
    id: string
    code: string
    title: string
    description: string
    language: string
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

        const response = await fetch(`${baseUrl}/api/paste?id=${id}`)
        if (!response.ok) {
            return {
                title: 'Paste Not Found',
                description: 'The requested paste could not be found',
            }
        }

        const paste: PasteData = await response.json()

        return {
            title: paste.title || 'discord.js Code Paste',
            description: paste.description || paste.code?.substring(0, 155) || 'View and analyze discord.js code',
            openGraph: {
                title: paste.title || 'discord.js Code Paste',
                description: paste.description || paste.code?.substring(0, 155) || 'View and analyze discord.js code',
                type: 'website',
                url: `${baseUrl}/paste/${id}`,
                images: [
                    {
                        url: '/djs.png',
                        width: 192,
                        height: 192,
                        alt: 'discord.js Logo',
                    },
                ],
            },
            twitter: {
                card: 'summary',
                title: paste.title || 'discord.js Code Paste',
                description: paste.description || paste.code?.substring(0, 155),
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

export default function PasteLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
