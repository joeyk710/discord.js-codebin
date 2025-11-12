'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeSwitcher from './ThemeSwitcher'
import { HomeIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline'

interface NavbarProps {
    onSaveShare?: () => void
    onShowMetadata?: () => void
    isSaving?: boolean
}

export default function Navbar({ onSaveShare, onShowMetadata, isSaving }: NavbarProps) {
    const pathname = usePathname()
    const isHomePage = pathname === '/'
    const isViewPage = pathname?.startsWith('/paste/') || pathname?.startsWith('/project/')
    const showEditorButtons = !isHomePage && !isViewPage

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
                    <div>
                        <h1 className="text-base sm:text-xl font-bold text-base-content">discord.js Code Bin</h1>
                    </div>
                </Link>
            </div>

            <div className="navbar-center gap-3 sm:gap-4 ml-6 sm:ml-10 lg:ml-16">
                <ThemeSwitcher />
                {!isHomePage && (
                    <Link href="/" className="btn btn-xs sm:btn-sm btn-ghost rounded-xl flex items-center">
                        <HomeIcon className="w-4 h-4 mr-2" />
                        <span className="hidden sm:inline">Home</span>
                    </Link>
                )}
                {showEditorButtons && (
                    <>
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
                    </>
                )}
            </div>

            <div className="navbar-end">
            </div>
        </div>
    )
}
