'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeSwitcher from './ThemeSwitcher'
import { HomeIcon, PlusIcon, PencilIcon } from '@heroicons/react/24/outline'

interface NavbarProps {
    onSaveShare?: () => void
    onShowMetadata?: () => void
    isSaving?: boolean
    // Project view actions
    onEdit?: () => void
    onDelete?: () => void
    onCancelEdit?: () => void
    onSaveEdit?: () => void
    isDeleting?: boolean
    isEditMode?: boolean
}

export default function Navbar({ onSaveShare, onShowMetadata, isSaving, onEdit, onDelete, onCancelEdit, onSaveEdit, isDeleting, isEditMode }: NavbarProps) {
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
                {/* Controls placed next to branding for tighter grouping */}
                <div className="hidden sm:flex items-center gap-2 sm:gap-3 ml-3">
                    <ThemeSwitcher />

                    {/* Editor page buttons (Save/Metadata) */}
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

                    {/* Project view actions: Edit/Delete (or Cancel/Save when editing) */}
                    {isViewPage && (
                        <div className="flex items-center gap-2">
                            {!isEditMode ? (
                                <>
                                    <button
                                        onClick={onEdit}
                                        className="btn btn-sm btn-primary rounded-xl"
                                        title="Edit project"
                                    >
                                        <span className="hidden sm:inline">✏️ Edit</span>
                                        <span className="sm:hidden">✏️</span>
                                    </button>
                                    <button
                                        onClick={onDelete}
                                        disabled={isDeleting}
                                        className="btn btn-sm btn-outline btn-error rounded-xl"
                                        title="Delete project"
                                    >
                                        {isDeleting ? (
                                            <>
                                                <span className="loading loading-spinner loading-sm"></span>
                                                Deleting...
                                            </>
                                        ) : (
                                            <>
                                                <span className="hidden sm:inline">🗑️ Delete</span>
                                                <span className="sm:hidden">🗑️</span>
                                            </>
                                        )}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={onCancelEdit}
                                        className="btn btn-sm btn-ghost rounded-xl"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={onSaveEdit}
                                        disabled={isSaving}
                                        className="btn btn-sm btn-primary rounded-xl"
                                    >
                                        {isSaving ? '⏳ Saving...' : '💾 Save'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="navbar-center" />

            <div className="navbar-end">
            </div>
        </div>
    )
}
