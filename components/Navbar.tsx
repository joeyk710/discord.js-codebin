'use client'

import Link from 'next/link'

interface NavbarProps {
    onSaveShare?: () => void
    isSaving?: boolean
}

export default function Navbar({ onSaveShare, isSaving }: NavbarProps) {
    return (
        <div className="navbar bg-base-100 flex-shrink-0 shadow-sm flex-wrap gap-2 p-2 sm:p-4">
            <div className="navbar-start w-full sm:w-auto">
                <Link
                    href="/"
                    className="btn btn-ghost rounded-xl gap-2 sm:gap-3 h-auto p-2 sm:p-3 flex-col sm:flex-row"
                >
                    <img
                        src="/djs.png"
                        alt="discord.js"
                        className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg"
                    />
                    <div className="hidden sm:block">
                        <h1 className="text-lg sm:text-xl font-bold text-base-content">discord.js Code Bin</h1>
                    </div>
                    <div className="sm:hidden">
                        <h1 className="text-sm font-bold text-base-content">DJS Code Bin</h1>
                    </div>
                </Link>
            </div>
        </div>
    )
}
