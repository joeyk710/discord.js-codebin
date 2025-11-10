import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'discord.js Code Bin - Paste',
    description: 'View and analyze discord.js code pastes',
}

export default function PasteLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return children
}
