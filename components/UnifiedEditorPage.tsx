'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import Navbar from './Navbar'
import MultiFileEditor from './MultiFileEditor'
import SaveModal from './SaveModal'
import ShareModal from './ShareModal'
import ThemeSwitcher from './ThemeSwitcher'
import Footer from './Footer'
import Link from 'next/link'

interface FileData {
    id: string
    path: string
    name: string
    code: string
    language: string
}

interface DraftState {
    projectTitle: string
    projectDescription: string
    files: FileData[]
    timestamp: number
}

const DRAFT_COOKIE_NAME = 'djs_editor_draft'
const DRAFT_EXPIRES_DAYS = 7

function saveDraftToCookie(data: DraftState) {
    try {
        const expirationDate = new Date()
        expirationDate.setDate(expirationDate.getDate() + DRAFT_EXPIRES_DAYS)

        const cookieValue = encodeURIComponent(JSON.stringify(data))
        document.cookie = `${DRAFT_COOKIE_NAME}=${cookieValue}; expires=${expirationDate.toUTCString()}; path=/; SameSite=Lax`
    } catch (error) {
        console.error('Failed to save draft to cookie:', error)
    }
}

function getDraftFromCookie(): DraftState | null {
    try {
        const name = DRAFT_COOKIE_NAME + '='
        const cookies = document.cookie.split(';')

        for (let cookie of cookies) {
            cookie = cookie.trim()
            if (cookie.indexOf(name) === 0) {
                const encoded = cookie.substring(name.length)
                const jsonString = decodeURIComponent(encoded)
                return JSON.parse(jsonString)
            }
        }
    } catch (error) {
        console.error('Failed to read draft from cookie:', error)
        // Clear corrupted cookie
        clearDraftCookie()
    }
    return null
}

function clearDraftCookie() {
    document.cookie = `${DRAFT_COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`
}

export default function UnifiedEditorPage() {
    const [projectTitle, setProjectTitle] = useState('My Project')
    const [projectDescription, setProjectDescription] = useState('')
    const [files, setFiles] = useState<FileData[]>([
        {
            id: '1',
            path: 'bot.js',
            name: 'bot.js',
            code: `import { Client, Events, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, () => {
  console.log('Bot is online!');
});

client.login(DISCORD_TOKEN);`,
            language: 'javascript',
        },
    ])
    const [hasDraft, setHasDraft] = useState(false)
    const [showRestoreDraftModal, setShowRestoreDraftModal] = useState(false)
    const [isMounted, setIsMounted] = useState(false)
    const restoreDraftDialogRef = useRef<HTMLDialogElement>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [shareUrl, setShareUrl] = useState('')
    const [expirationDays, setExpirationDays] = useState<number | null>(null)
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showMetadataModal, setShowMetadataModal] = useState(false)
    const [showLeaveModal, setShowLeaveModal] = useState(false)
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)
    const [showRefreshWarning, setShowRefreshWarning] = useState(false)
    const metadataModalRef = useRef<HTMLInputElement>(null)
    const leaveModalRef = useRef<HTMLDialogElement>(null)
    const refreshModalRef = useRef<HTMLDialogElement>(null)
    const [isEditorFullscreen, setIsEditorFullscreen] = useState(false)

    // Only initialize on client side to prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true)
        // Delay draft loading to ensure component is fully mounted
        const timer = setTimeout(() => {
            const draft = getDraftFromCookie()
            if (draft) {
                setHasDraft(true)
                setShowRestoreDraftModal(true)
            }
        }, 100)
        return () => clearTimeout(timer)
    }, [])

    // Sync dialog state for restore draft modal
    useEffect(() => {
        if (!isMounted || !restoreDraftDialogRef.current) return
        if (showRestoreDraftModal) {
            restoreDraftDialogRef.current.showModal()
        } else {
            restoreDraftDialogRef.current.close()
        }
    }, [showRestoreDraftModal, isMounted])

    // Warn before unload if there are unsaved files using daisyUI modal
    useEffect(() => {
        // Track if user has unsaved changes
        const hasUnsavedChanges = files.length > 1 || files[0]?.code !== ''

        // Intercept keyboard shortcuts (Cmd+R, Ctrl+R, F5, etc)
        const handleKeyDown = (e: KeyboardEvent) => {
            if (hasUnsavedChanges) {
                // F5 or Cmd+R or Ctrl+R or Ctrl+Shift+R
                if (
                    e.key === 'F5' ||
                    (e.metaKey && e.key === 'r') ||
                    (e.ctrlKey && e.key === 'r') ||
                    (e.ctrlKey && e.shiftKey && e.key === 'r')
                ) {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowRefreshWarning(true)
                }
            }
        }

        // Show daisyUI modal for client-side navigation only (back button)
        const handleNavigation = (e: PopStateEvent) => {
            if (hasUnsavedChanges) {
                setPendingNavigation(() => () => {
                    window.removeEventListener('popstate', handleNavigation)
                    window.history.forward()
                })
                if (leaveModalRef.current) {
                    leaveModalRef.current.showModal()
                }
                e.preventDefault()
            }
        }

        window.addEventListener('keydown', handleKeyDown, true)
        window.addEventListener('popstate', handleNavigation)
        return () => {
            window.removeEventListener('keydown', handleKeyDown, true)
            window.removeEventListener('popstate', handleNavigation)
        }
    }, [files])

    // Sync refresh modal state with ref
    useEffect(() => {
        if (!isMounted || !refreshModalRef.current) return
        if (showRefreshWarning) {
            refreshModalRef.current.showModal()
        } else {
            refreshModalRef.current.close()
        }
    }, [showRefreshWarning, isMounted])

    // Auto-save draft to cookie whenever files or metadata change
    // Only save if there's meaningful content (modified code or custom title)
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only save if: custom title OR description OR modified code
            const defaultCode = `import { Client, Events, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, () => {
  console.log('Bot is online!');
});

client.login(DISCORD_TOKEN);`

            const hasContent =
                projectTitle !== 'My Project' ||
                projectDescription !== '' ||
                files.some(f => f.code !== defaultCode)

            if (hasContent) {
                const draftState: DraftState = {
                    projectTitle,
                    projectDescription,
                    files,
                    timestamp: Date.now(),
                }
                saveDraftToCookie(draftState)
            }
        }, 1000) // Save after 1 second of inactivity

        return () => clearTimeout(timer)
    }, [projectTitle, projectDescription, files])

    // Sync checkbox state for metadata modal
    useEffect(() => {
        if (metadataModalRef.current) {
            metadataModalRef.current.checked = showMetadataModal
        }
    }, [showMetadataModal])

    const handleSaveWithMetadata = async (metadata: any) => {
        setIsSaving(true)
        setShowSaveModal(false)
        try {
            // Convert expirationMinutes to expirationDays for projects
            let expirationDaysToSend: number | undefined = undefined
            if (metadata.expirationMinutes) {
                // Convert minutes to days (1440 minutes = 1 day)
                expirationDaysToSend = Math.ceil(metadata.expirationMinutes / 1440)
            }

            const response = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: projectTitle || 'Untitled Project',
                    description: projectDescription || '',
                    files: files.map(f => ({
                        path: f.path,
                        code: f.code,
                        language: f.language,
                    })),
                    isPublic: metadata.isPublic,
                    expirationDays: expirationDaysToSend || expirationDays,
                }),
            })
            const data = await response.json()

            if (data.id) {
                // Clear the draft cookie after successful save
                clearDraftCookie()

                // Store project ID
                const ownedProjects = JSON.parse(localStorage.getItem('ownedProjects') || '[]')
                if (!ownedProjects.includes(data.id)) {
                    ownedProjects.push(data.id)
                    localStorage.setItem('ownedProjects', JSON.stringify(ownedProjects))
                }

                const url = data.shortUrl || `${window.location.origin}/project/${data.id}`
                setShareUrl(url)
                setShowShareModal(true)
            }
        } catch (error) {
            console.error(error)
            alert('Failed to save project')
        } finally {
            setIsSaving(false)
        }
    }

    const handleRestoreDraft = () => {
        // First, update state
        const draft = getDraftFromCookie()
        if (draft) {
            setProjectTitle(draft.projectTitle)
            setProjectDescription(draft.projectDescription)
            setFiles(draft.files)
        }
        // Then close modal
        setShowRestoreDraftModal(false)
        setHasDraft(false)
    }

    const handleDiscardDraft = () => {
        clearDraftCookie()
        setShowRestoreDraftModal(false)
        setHasDraft(false)
    }

    const handleFilesChange = useCallback((updatedFiles: FileData[]) => {
        setFiles(updatedFiles)
    }, [])

    return (
        <div className="flex flex-col h-screen bg-base-100">
            {!isEditorFullscreen && (
                <Navbar
                    onSaveShare={() => setShowSaveModal(true)}
                    isSaving={isSaving}
                />
            )}

            <main className="flex-1 overflow-hidden flex flex-col m-1 sm:m-3 min-h-0">
                <div className="flex-1 overflow-hidden rounded-2xl shadow-xl bg-base-100 flex flex-col min-h-0">
                    {/* Content Container */}
                    <div className="w-full px-2 sm:px-3 py-1 sm:py-2 flex-1 flex flex-col gap-1 sm:gap-4 overflow-hidden min-h-0">
                        {/* Top Row: Action Buttons */}
                        <div className="flex gap-1 sm:gap-2 flex-wrap items-center shrink-0">
                            <ThemeSwitcher />
                            <Link href="/" className="btn btn-xs sm:btn-sm btn-ghost rounded-xl">
                                <span className="hidden sm:inline">🏠 Home</span>
                                <span className="sm:hidden">🏠</span>
                            </Link>
                            <button
                                onClick={() => setShowSaveModal(true)}
                                disabled={isSaving}
                                className="btn btn-xs sm:btn-sm btn-primary rounded-xl"
                                title="Save and share your project"
                            >
                                <span className="hidden sm:inline">{isSaving ? '⏳ Saving...' : '💾 Save & Share'}</span>
                                <span className="sm:hidden">{isSaving ? '⏳' : '💾'}</span>
                            </button>
                            <button
                                onClick={() => setShowMetadataModal(true)}
                                className="btn btn-xs sm:btn-sm btn-ghost rounded-xl"
                                title="Edit project metadata"
                            >
                                <span className="hidden sm:inline">📋 Metadata</span>
                                <span className="sm:hidden">📋</span>
                            </button>
                        </div>

                        {/* Editor */}
                        <div className="flex-1 overflow-hidden rounded-xl border border-base-300 min-h-0 relative">
                            <MultiFileEditor
                                initialFiles={files}
                                onFilesChange={handleFilesChange}
                            />
                            {/* Fullscreen toggle */}
                            <button
                                aria-label="Toggle fullscreen editor"
                                onClick={() => setIsEditorFullscreen(true)}
                                className="absolute top-3 right-3 btn btn-xs btn-ghost rounded-full text-2xl z-10"
                                title="Open editor fullscreen"
                            >
                                ⤢
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {!isEditorFullscreen && <Footer />}

            {/* Fullscreen editor overlay */}
            {isEditorFullscreen && (
                <div className="fixed inset-0 z-50 bg-base-100 p-2 sm:p-6">
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-end gap-2 mb-2">
                            <button
                                onClick={() => setIsEditorFullscreen(false)}
                                className="btn btn-sm btn-ghost rounded-xl"
                            >
                                Close
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden rounded-lg border border-base-300">
                            <MultiFileEditor
                                initialFiles={files}
                                onFilesChange={handleFilesChange}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <SaveModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onSave={handleSaveWithMetadata}
                isSaving={isSaving}
            />

            <ShareModal
                shareUrl={shareUrl}
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                title={projectTitle}
                description={projectDescription}
                expirationDays={expirationDays}
                onExpirationChange={setExpirationDays}
            />

            {/* Metadata Modal */}
            <input
                ref={metadataModalRef}
                type="checkbox"
                id="metadata_modal"
                className="modal-toggle"
            />
            <div className="modal">
                <div className="modal-box rounded-2xl">
                    <h3 className="font-bold text-lg mb-6">Project Metadata</h3>
                    <form className="space-y-4">
                        <div>
                            <label className="label">
                                <span className="label-text font-semibold">Project Title</span>
                            </label>
                            <input
                                type="text"
                                value={projectTitle}
                                onChange={(e) => setProjectTitle(e.target.value)}
                                placeholder="My Awesome Project"
                                className="input input-bordered w-full"
                            />
                        </div>
                        <div>
                            <label className="label">
                                <span className="label-text font-semibold">Description</span>
                            </label>
                            <textarea
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                                placeholder="Describe your project..."
                                className="textarea textarea-bordered w-full"
                                rows={4}
                            />
                        </div>
                        <div className="modal-action">
                            <button
                                type="button"
                                onClick={() => setShowMetadataModal(false)}
                                className="btn btn-ghost rounded-xl"
                            >
                                Close
                            </button>
                        </div>
                    </form>
                </div>
                <label
                    className="modal-backdrop"
                    htmlFor="metadata_modal"
                    onClick={() => setShowMetadataModal(false)}
                />
            </div>

            {/* Restore Draft Modal - Only render on client to prevent hydration mismatch */}
            {isMounted && (
                <dialog
                    ref={restoreDraftDialogRef}
                    className="modal"
                    onClose={() => {
                        // Only update state if modal is still showing
                        if (showRestoreDraftModal) {
                            setShowRestoreDraftModal(false)
                        }
                    }}
                >
                    <div className="modal-box rounded-2xl">
                        <h3 className="font-bold text-lg">Restore Previous Draft?</h3>
                        <p className="py-4 text-base-content/70">
                            We found your previous work. Would you like to restore it or start fresh?
                        </p>
                        <div className="modal-action">
                            <button
                                onClick={handleDiscardDraft}
                                className="btn btn-ghost rounded-xl"
                            >
                                Start Fresh
                            </button>
                            <button
                                onClick={handleRestoreDraft}
                                className="btn btn-primary rounded-xl"
                            >
                                Restore Draft
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button>close</button>
                    </form>
                </dialog>
            )}

            {/* Leave Confirmation Modal */}
            {isMounted && (
                <dialog
                    ref={leaveModalRef}
                    className="modal"
                >
                    <div className="modal-box rounded-2xl">
                        <h3 className="font-bold text-lg text-warning">⚠️ Unsaved Changes</h3>
                        <p className="py-4 text-base-content/70">
                            You have unsaved changes. Are you sure you want to leave without saving?
                        </p>
                        <div className="modal-action">
                            <form method="dialog">
                                <button
                                    className="btn btn-ghost rounded-xl"
                                >
                                    Stay
                                </button>
                            </form>
                            <button
                                onClick={() => {
                                    if (leaveModalRef.current) {
                                        leaveModalRef.current.close()
                                    }
                                    if (pendingNavigation) {
                                        pendingNavigation()
                                    }
                                }}
                                className="btn btn-error rounded-xl"
                            >
                                Leave
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button>close</button>
                    </form>
                </dialog>
            )}

            {/* Refresh Warning Modal */}
            {isMounted && (
                <dialog
                    ref={refreshModalRef}
                    className="modal"
                >
                    <div className="modal-box rounded-2xl">
                        <h3 className="font-bold text-lg text-warning">⏸️ Wait!</h3>
                        <p className="py-4 text-base-content/70">
                            You have unsaved changes. Refreshing will lose all your work.
                        </p>
                        <p className="text-sm text-base-content/60 mb-4">
                            Save your project first to keep your progress.
                        </p>
                        <div className="modal-action">
                            <form method="dialog">
                                <button
                                    className="btn btn-ghost rounded-xl"
                                >
                                    Cancel
                                </button>
                            </form>
                            <button
                                onClick={() => {
                                    // Close modal
                                    if (refreshModalRef.current) {
                                        refreshModalRef.current.close()
                                    }
                                    setShowRefreshWarning(false)
                                    // Now reload the page
                                    window.location.reload()
                                }}
                                className="btn btn-warning rounded-xl"
                            >
                                Refresh Anyway
                            </button>
                        </div>
                    </div>
                    <form method="dialog" className="modal-backdrop">
                        <button>close</button>
                    </form>
                </dialog>
            )}
        </div>
    )
}




