import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'discord.js Code Bin',
  description: 'Write and share discord.js code with intelligent suggestions',
  metadataBase: new URL('https://discord-js-codebin.vercel.app'),
  icons: {
    icon: '/djs.png',
    apple: '/djs.png',
  },
  openGraph: {
    title: 'discord.js Code Bin',
    description: 'Write and share discord.js code with intelligent suggestions',
    images: [
      {
        url: '/djs.png',
        width: 1200,
        height: 630,
        alt: 'discord.js Code Bin',
      },
    ],
    url: 'https://discord-js-codebin.vercel.app',
    type: 'website',
    siteName: 'discord.js Code Bin',
  },
  twitter: {
    card: 'summary',
    title: 'discord.js Code Bin',
    description: 'Write and share discord.js code with intelligent suggestions',
    images: [
      {
        url: '/djs.png',
      }
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.variable} ${geistMono.variable} antialiased px-2 py-2 sm:px-4 sm:py-4 md:px-6 md:py-6 bg-base-100`}
      >
        {children}
      </body>
    </html>
  )
}
