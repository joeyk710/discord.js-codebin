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
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showMetadataModal, setShowMetadataModal] = useState(false)
    const metadataModalRef = useRef<HTMLInputElement>(null)

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

    // Warn before unload if there are unsaved files
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            // Always show warning if there are multiple files or if code has been modified
            if (files.length > 1 || files[0]?.code !== '') {
                e.preventDefault()
                e.returnValue = ''
            }
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [files])

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
            <Navbar
                onSaveShare={() => setShowSaveModal(true)}
                isSaving={isSaving}
            />

            <main className="flex-1 overflow-hidden flex flex-col m-1 sm:m-3">
                <div className="flex-1 overflow-hidden rounded-2xl shadow-xl bg-base-100 flex flex-col">
                    {/* Content Container */}
                    <div className="w-full px-2 sm:px-3 py-2 sm:py-4 flex-1 flex flex-col gap-2 sm:gap-4 overflow-hidden min-h-0">
                        {/* Top Row: Action Buttons */}
                        <div className="flex gap-1 sm:gap-2 flex-wrap items-center">
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
                        <div className="flex-1 overflow-hidden rounded-xl border border-base-300">
                            <MultiFileEditor
                                initialFiles={files}
                                onFilesChange={handleFilesChange}
                            />
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

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
        </div>
    )
}
