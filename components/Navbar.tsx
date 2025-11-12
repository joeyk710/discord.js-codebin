'use client'

import Link from 'next/link'
import ThemeSwitcher from './ThemeSwitcher'
import { HomeIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline'

interface NavbarProps {
    onSaveShare?: () => void
    onShowMetadata?: () => void
    isSaving?: boolean
}

export default function Navbar({ onSaveShare, onShowMetadata, isSaving }: NavbarProps) {
    return (
        <div className="navbar bg-base-100 flex-shrink-0 shadow-none gap-4 px-2 sm:px-6 py-3 sm:py-4">
            <div className="navbar-start w-auto">
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

            <div className="navbar-center gap-3 sm:gap-4">
                <ThemeSwitcher />
                <Link href="/" className="btn btn-xs sm:btn-sm btn-ghost rounded-xl flex items-center">
                    <HomeIcon className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Home</span>
                </Link>
                <button
                    onClick={onShowMetadata}
                    className="btn btn-xs sm:btn-sm btn-ghost rounded-xl flex items-center gap-2"
                    title="Edit project metadata"
                >
                    <PencilIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Metadata</span>
                </button>
                <button
                    onClick={onSaveShare}
                    disabled={isSaving}
                    className="btn btn-xs sm:btn-sm btn-primary rounded-xl flex items-center gap-2"
                    title="Save and share your project"
                >
                    <PlusIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">{isSaving ? '⏳ Saving...' : 'Save & Share'}</span>
                    <span className="sm:hidden">{isSaving ? '⏳' : 'Save'}</span>
                </button>
            </div>

            <div className="navbar-end">
            </div>
        </div>
    )
}
