'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { PencilIcon } from '@heroicons/react/24/outline'
import Navbar from './Navbar'
import MultiFileEditor from './MultiFileEditor'
import SaveModal from './SaveModal'
import ShareModal from './ShareModal'
import Footer from './Footer'

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
    // optional in-progress rename draft saved separately from files
    renameDraft?: { path: string; name: string; timestamp?: number }
}

const DRAFT_COOKIE_NAME = 'djs_editor_draft'
const DRAFT_EXPIRES_DAYS = 7

// Default starter file used when creating a new project
const DEFAULT_FILE: FileData = {
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
}

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
    // Use a stable default file constant so effects and initial state are consistent
    const [projectTitle, setProjectTitle] = useState('My Project')
    const [projectDescription, setProjectDescription] = useState('')
    const [files, setFiles] = useState<FileData[]>([DEFAULT_FILE])
    const [isMounted, setIsMounted] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [shareUrl, setShareUrl] = useState('')
    const [lastSavedIsPublic, setLastSavedIsPublic] = useState<boolean | undefined>(undefined)
    const [expirationDays, setExpirationDays] = useState<number | null>(null)
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    const [showMetadataModal, setShowMetadataModal] = useState(false)
    const [showLeaveModal, setShowLeaveModal] = useState(false)
    const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null)
    const [showRefreshWarning, setShowRefreshWarning] = useState(false)
    const metadataModalRef = useRef<HTMLInputElement>(null)
    const leaveModalRef = useRef<HTMLDialogElement>(null)
    const refreshModalRef = useRef<HTMLDialogElement>(null)
    const draftModalRef = useRef<HTMLDialogElement>(null)

    // Only initialize on client side to prevent hydration mismatch
    const [draftAvailable, setDraftAvailable] = useState(false)
    const draftRef = useRef<DraftState | null>(null)

    useEffect(() => {
        setIsMounted(true)
        // Check for draft and *don't* auto-restore it. Offer explicit restore to avoid
        // overwriting content when opening the editor from another context (e.g., viewing a paste).
        const draft = getDraftFromCookie()
        // also check for an in-progress rename draft saved to localStorage
        let renameDraft = null
        try {
            const raw = localStorage.getItem('djs_rename_draft')
            if (raw) renameDraft = JSON.parse(raw)
        } catch (e) {
            // ignore parse errors
            renameDraft = null
        }
        if (draft) {
            if (renameDraft) {
                draft.renameDraft = renameDraft
            }
            draftRef.current = draft
            setDraftAvailable(true)
        } else if (renameDraft) {
            // If there's no full draft cookie but an in-progress rename exists, surface it as a draft
            draftRef.current = {
                projectTitle,
                projectDescription,
                files,
                timestamp: Date.now(),
                renameDraft,
            }
            setDraftAvailable(true)
        }
    }, [])

    // Show/hide the draft modal when a draft is available
    useEffect(() => {
        if (!isMounted || !draftModalRef.current) return
        if (draftAvailable) {
            draftModalRef.current.showModal()
        } else {
            try {
                draftModalRef.current.close()
            } catch (e) {
                // ignore
            }
        }
    }, [draftAvailable, isMounted])

    // Warn before unload if there are unsaved files using daisyUI modal
    useEffect(() => {
        // Track if user has unsaved changes
        const hasUnsavedChanges = files.length > 1 || files[0]?.code !== DEFAULT_FILE.code

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
            const hasContent =
                projectTitle !== 'My Project' ||
                projectDescription !== '' ||
                files.some(f => f.code !== DEFAULT_FILE.code)

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
        // Don't close the modal immediately - wait for save to complete
        try {
            // Validate title
            if (!projectTitle || projectTitle.trim() === '') {
                setErrorMessage('Project title is required')
                setShowErrorModal(true)
                setIsSaving(false)
                return
            }

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
                    title: projectTitle.trim(),
                    description: projectDescription.trim(),
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

            console.log('Save response:', { status: response.status, ok: response.ok, data })

            if (!response.ok) {
                console.error('API Error:', data)
                const errorMsg = data.error || data.message || 'Unknown error'
                setErrorMessage(`Failed to save project: ${errorMsg}`)
                setShowErrorModal(true)
                setIsSaving(false)
                setShowSaveModal(true)
                return
            }

            if (data.id) {
                // Clear the draft cookie after successful save
                clearDraftCookie()

                // Store project ID and deletion token in localStorage. Support older string-only entries.
                try {
                    const raw = localStorage.getItem('ownedProjects') || '[]'
                    let ownedProjects: Array<any> = JSON.parse(raw)

                    // Normalize any string-only entries to object form
                    ownedProjects = ownedProjects.map((entry: any) => {
                        if (typeof entry === 'string') return { id: entry, deletionToken: null }
                        return entry
                    })

                    // Check if this project already exists
                    const exists = ownedProjects.some((p: any) => p.id === data.id)
                    if (!exists) {
                        ownedProjects.push({ id: data.id, deletionToken: data.deletionToken || null })
                        localStorage.setItem('ownedProjects', JSON.stringify(ownedProjects))
                    } else {
                        // If exists but token missing, update the token if provided
                        if (data.deletionToken) {
                            ownedProjects = ownedProjects.map((p: any) => p.id === data.id ? { ...p, deletionToken: data.deletionToken } : p)
                            localStorage.setItem('ownedProjects', JSON.stringify(ownedProjects))
                        }
                    }
                } catch (err) {
                    // Fallback: write simple array of ids if parsing fails
                    try {
                        localStorage.setItem('ownedProjects', JSON.stringify([data.id]))
                    } catch (e) {
                        console.error('Failed to persist ownedProjects', e)
                    }
                }

                // Remember whether the saved project was public so the ShareModal can display visibility
                setLastSavedIsPublic(!!metadata.isPublic)

                const url = data.shortUrl || `${window.location.origin}/project/${data.id}`
                setShareUrl(url)

                // Close save modal and show share modal after successful save
                setShowSaveModal(false)
                setShowShareModal(true)
                setIsSaving(false)
            }
        } catch (error) {
            console.error(error)
            setErrorMessage('Failed to save project')
            setShowErrorModal(true)
            setIsSaving(false)
            setShowSaveModal(true)
        }
    }

    const handleFilesChange = useCallback((updatedFiles: FileData[]) => {
        setFiles(updatedFiles)
    }, [])

    return (
        <div className="flex flex-col h-screen bg-base-100">
            {/* Draft restore modal (replaces the non-blocking banner) */}
            {isMounted && (
                <dialog ref={draftModalRef} className="modal">
                    <div className="modal-box rounded-2xl">
                        <h3 className="font-bold text-lg">You have a saved draft</h3>
                        <p className="py-2 text-base-content/70">Restore your saved draft or discard it.</p>
                        {draftRef.current?.renameDraft && (
                            <div className="mt-3 p-3 bg-info/10 border border-info/30 rounded-lg">
                                <p className="text-sm text-info">
                                    You were editing the filename of <span className="font-mono">{draftRef.current.renameDraft.path.split('/').pop()}</span> — unsaved name: <span className="font-mono font-semibold">{draftRef.current.renameDraft.name}</span>
                                </p>
                            </div>
                        )}
                        <div className="modal-action">
                            <button
                                className="btn btn-ghost rounded-xl"
                                onClick={() => {
                                    clearDraftCookie()
                                    try { localStorage.removeItem('djs_rename_draft') } catch (e) { }
                                    draftRef.current = null
                                    setDraftAvailable(false)
                                    try { draftModalRef.current?.close() } catch (e) { }
                                }}
                            >
                                Discard
                            </button>
                            <button
                                className="btn btn-primary rounded-xl"
                                onClick={() => {
                                    const d = draftRef.current
                                    if (d) {
                                        setProjectTitle(d.projectTitle)
                                        setProjectDescription(d.projectDescription)
                                        // If draft contains files, use them (restore full draft). Otherwise prefer current files.
                                        if (d.files && d.files.length > 0) {
                                            let restoredFiles = d.files
                                            // Apply any renameDraft if present
                                            if (d.renameDraft) {
                                                restoredFiles = restoredFiles.map(f => {
                                                    if (f.path === d.renameDraft?.path) {
                                                        const lastSlash = f.path.lastIndexOf('/')
                                                        const dir = lastSlash > -1 ? f.path.substring(0, lastSlash + 1) : ''
                                                        const newPath = `${dir}${d.renameDraft.name}`
                                                        return { ...f, path: newPath, name: d.renameDraft.name }
                                                    }
                                                    return f
                                                })
                                            }
                                            setFiles(restoredFiles)
                                        } else {
                                            // No full files in cookie; apply renameDraft to current files if present
                                            if (d.renameDraft) {
                                                setFiles(prev => prev.map(f => {
                                                    if (f.path === d.renameDraft?.path) {
                                                        const lastSlash = f.path.lastIndexOf('/')
                                                        const dir = lastSlash > -1 ? f.path.substring(0, lastSlash + 1) : ''
                                                        const newPath = `${dir}${d.renameDraft!.name}`
                                                        return { ...f, path: newPath, name: d.renameDraft!.name }
                                                    }
                                                    return f
                                                }))
                                            }
                                        }

                                        clearDraftCookie()
                                        try { localStorage.removeItem('djs_rename_draft') } catch (e) { }
                                        draftRef.current = null
                                        setDraftAvailable(false)
                                    }
                                    try { draftModalRef.current?.close() } catch (e) { }
                                }}
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
            <Navbar
                onSaveShare={() => setShowSaveModal(true)}
                onShowMetadata={() => setShowMetadataModal(true)}
                isSaving={isSaving}
            />

            <main className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-hidden bg-base-100 flex flex-col">
                    {/* Content Container */}
                    <div className="w-full flex-1 flex flex-col overflow-hidden">
                        {/* Editor */}
                        <div className="flex-1 overflow-hidden rounded-xl border border-base-300 min-h-0 relative">
                            <MultiFileEditor
                                initialFiles={files}
                                onFilesChange={handleFilesChange}
                            />
                        </div>
                    </div>
                </div>

            </main>

            {/* Footer */}
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
                title={projectTitle}
                description={projectDescription}
                isPublic={lastSavedIsPublic}
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
                <div className="modal-box rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
                            <PencilIcon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-2xl text-base-content">Edit Metadata</h3>
                            <p className="text-sm text-base-content/60">Update your project details</p>
                        </div>
                    </div>
                    <form className="space-y-5">
                        <div className="divider my-0"></div>
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="label m-0 p-0">
                                    <span className="label-text font-semibold">Project Title</span>
                                </label>
                                <span className="text-xs text-base-content/60">{projectTitle.length}/100</span>
                            </div>
                            <input
                                type="text"
                                value={projectTitle}
                                onChange={(e) => setProjectTitle(e.target.value)}
                                placeholder="My Awesome Project"
                                className="input input-bordered w-full rounded-xl validator"
                                maxLength={100}
                                required
                            />
                            <p className="validator-hint text-xs text-base-content/60 mt-2">Project title max 100 characters</p>
                        </div>
                        <div>
                            <div className="flex items-center justify-between">
                                <label className="label m-0 p-0">
                                    <span className="label-text font-semibold">Description</span>
                                </label>
                                <span className="text-xs text-base-content/60">{projectDescription.length}/1024</span>
                            </div>
                            <textarea
                                value={projectDescription}
                                onChange={(e) => setProjectDescription(e.target.value)}
                                placeholder="Describe your project..."
                                className="textarea textarea-bordered w-full rounded-xl validator"
                                rows={4}
                                maxLength={1024}
                            />
                            <p className="validator-hint text-xs text-base-content/60 mt-2">Description max 1024 characters</p>
                        </div>
                        <div className="modal-action gap-3">
                            <button
                                type="button"
                                onClick={() => setShowMetadataModal(false)}
                                className="btn btn-ghost rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowMetadataModal(false)}
                                className="btn btn-primary rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!projectTitle || projectTitle.trim() === ''}
                                aria-disabled={!projectTitle || projectTitle.trim() === ''}
                            >
                                Done
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

            {/* Error Modal (replaces browser alerts) */}
            {showErrorModal && (
                <dialog className="modal">
                    <div className="modal-box rounded-2xl">
                        <h3 className="font-bold text-lg text-error">❌ Error</h3>
                        <p className="py-4 text-base-content/70">{errorMessage}</p>
                        <div className="modal-action">
                            <button
                                className="btn btn-primary rounded-xl"
                                onClick={() => setShowErrorModal(false)}
                            >
                                OK
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




