'use client'

import { useState, useEffect, useRef } from 'react'
import ErrorModal from '@/components/ErrorModal'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MultiFileEditor from '@/components/MultiFileEditor'
import Footer from '@/components/Footer'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import Link from 'next/link'
import TrashIcon from '@heroicons/react/24/outline/TrashIcon'
import CommentsPanel from '@/components/CommentsPanel'
import DiffViewer from '@/components/DiffViewer'
import { useCurrentUser } from '@/lib/useCurrentUser'

// Minimal typing for Cloudflare Turnstile client to avoid `any` casts.
type Turnstile = {
    render: (
        el: HTMLElement,
        opts: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void }
    ) => number
    reset: (id?: number) => void
}

declare global {
    interface Window {
        turnstile?: Turnstile
    }
}
function ExpirationDisplay({ createdAt, expirationDays }: { createdAt: string; expirationDays: number }) {
    const [info, setInfo] = useState<{ pretty: string; duration: string } | null>(null)

    const compute = () => {
        try {
            const created = new Date(createdAt)
            const exp = new Date(created)
            exp.setDate(exp.getDate() + expirationDays)
            const pretty = exp.toLocaleString(undefined, {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
            })

            const minsLeft = Math.max(0, Math.floor((exp.getTime() - Date.now()) / 60000))
            let duration = ''
            if (minsLeft <= 0) {
                duration = 'Expired'
            } else if (minsLeft < 60) {
                duration = `Expires in ${minsLeft} minute${minsLeft === 1 ? '' : 's'}`
            } else if (minsLeft < 60 * 24) {
                const hours = Math.floor(minsLeft / 60)
                duration = `Expires in ${hours} hour${hours === 1 ? '' : 's'}`
            } else {
                const days = Math.floor(minsLeft / (60 * 24))
                duration = `Expires in ${days} day${days === 1 ? '' : 's'}`
            }

            setInfo({ pretty, duration })
        } catch (e) {
            setInfo(null)
        }
    }

    useEffect(() => {
        compute()
        const id = setInterval(compute, 30000)
        return () => clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [createdAt, expirationDays])

    if (!info) return null

    return (
        <span className="badge badge-ghost badge-sm flex flex-col items-start">
            <span className="text-xs">⏳</span>
            <span className="text-xs">{info.duration}</span>
            <span className="text-[10px] opacity-60">{info.pretty}</span>
        </span>
    )
}

interface ProjectData {
    id: string
    title: string
    description: string | null
    projectFiles?: Array<{
        id: string
        path: string
        name: string
        code: string
        language: string
    }>
    files?: Array<{
        id: string
        path: string
        name: string
        code: string
        language: string
    }>
    createdAt: string
    views: number
    isPublic: boolean
    expirationDays?: number | null
}

export default function ProjectViewerPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string
    const currentUser = useCurrentUser()
    const [project, setProject] = useState<ProjectData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isEditMode, setIsEditMode] = useState(false)
    const [editedFiles, setEditedFiles] = useState<Array<any>>([])
    const [isSaving, setIsSaving] = useState(false)
    const [showSuccessModal, setShowSuccessModal] = useState(false)
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const deleteModalRef = useRef<HTMLInputElement>(null)
    const successModalRef = useRef<HTMLDialogElement>(null)
    // errorModalRef removed in favor of portaled ErrorModal
    const [cfTurnstileToken, setCfTurnstileToken] = useState<string | null>(null)
    const widgetIdRef = useRef<number | null>(null)
    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
    const [showCommentsSidebar, setShowCommentsSidebar] = useState(false)
    const [showChangesModal, setShowChangesModal] = useState(false)
    const [activeFilePath, setActiveFilePath] = useState<string>('')
    const changesModalRef = useRef<HTMLDialogElement>(null)
    const multiFileEditorRef = useRef<any>(null)
    const deleteCommentModalRef = useRef<HTMLDialogElement | null>(null)
    const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null)
    const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)

    const handleHighlightLine = (filePath: string, lineNumber: number) => {
        // Call the MultiFileEditor's highlight method via ref
        multiFileEditorRef.current?.highlightLine?.(filePath, lineNumber)
    }

    useEffect(() => {
        async function loadProject() {
            try {
                setLoading(true)

                // If the current user owns this project, include their deletion token
                // from localStorage so private projects can be loaded for owners.
                const ownedRaw = localStorage.getItem('ownedProjects') || '[]'
                let ownedProjects: any[] = []
                try {
                    ownedProjects = JSON.parse(ownedRaw)
                } catch (e) {
                    ownedProjects = []
                }

                let token: string | null = null
                for (const entry of ownedProjects) {
                    if (typeof entry === 'string' && entry === id) {
                        token = null
                        break
                    }
                    if (entry && entry.id === id) {
                        token = entry.deletionToken || null
                        break
                    }
                }

                const headers: Record<string, string> = {}
                if (token) headers['Authorization'] = `Bearer ${token}`

                const response = await fetch(`/api/projects?id=${id}`, { headers })
                if (!response.ok) {
                    // Surface API error messages (401 for private projects without token)
                    const body = await response.json().catch(() => ({}))
                    const errMsg = body?.error || body?.message || 'Failed to load project'
                    throw new Error(errMsg)
                }
                const data = await response.json()
                setProject(data)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error')
            } finally {
                setLoading(false)
            }
        }

        loadProject()
    }, [id])

    // Sync checkbox state for delete modal
    useEffect(() => {
        if (deleteModalRef.current) {
            deleteModalRef.current.checked = showDeleteModal
        }
    }, [showDeleteModal])

    // Control success modal
    useEffect(() => {
        if (showSuccessModal && successModalRef.current) {
            successModalRef.current.showModal()
        }
    }, [showSuccessModal])

    // Control changes modal
    useEffect(() => {
        const dialog = changesModalRef.current
        if (!dialog) return

        if (showChangesModal) {
            dialog.showModal()
        } else {
            dialog.close()
        }

        // Handle modal close button or backdrop click
        const handleClose = () => {
            setShowChangesModal(false)
        }

        dialog.addEventListener('close', handleClose)
        return () => dialog.removeEventListener('close', handleClose)
    }, [showChangesModal])

    // Error modal shown via ErrorModal component below

    // Load Cloudflare Turnstile widget when delete modal is shown (if configured)
    useEffect(() => {
        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
        if (!showDeleteModal || !siteKey) return

        let mounted = true

        const loadAndRender = async () => {
            try {
                if (!window.turnstile) {
                    const s = document.createElement('script')
                    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js'
                    s.async = true
                    s.defer = true
                    document.head.appendChild(s)
                    await new Promise((res) => {
                        s.onload = () => res(true)
                        s.onerror = () => res(true)
                    })
                }

                const container = document.getElementById('turnstile-container')
                if (container && window.turnstile && mounted) {
                    try {
                        // If we haven't rendered the widget yet, render it.
                        if (widgetIdRef.current == null) {
                            widgetIdRef.current = window.turnstile.render(container, {
                                sitekey: siteKey,
                                callback: (token: string) => setCfTurnstileToken(token),
                                'expired-callback': () => setCfTurnstileToken(null),
                            })
                        } else {
                            // If the widget already exists (modal reopened), reset it so a fresh
                            // challenge/token is issued each time the modal opens.
                            try {
                                window.turnstile.reset(widgetIdRef.current)
                                // Clear stored token so the UI requires the new CAPTCHA completion
                                setCfTurnstileToken(null)
                            } catch (e) {
                                console.error('Turnstile reset error', e)
                                // As a fallback, attempt to re-render by clearing the ref so above
                                // branch renders a new widget on the next effect run.
                                widgetIdRef.current = null
                            }
                        }
                    } catch (e) {
                        // ignore render errors
                        console.error('Turnstile render error', e)
                    }
                }
            } catch (e) {
                console.error('Error loading Turnstile', e)
            }
        }

        loadAndRender()

        return () => {
            mounted = false
        }
    }, [showDeleteModal])

    const handleDeleteProject = async () => {
        try {
            setIsDeleting(true)
            // Read deletion token from localStorage (ownedProjects may contain strings or objects)
            const ownedRaw = localStorage.getItem('ownedProjects') || '[]'
            let ownedProjects: any[] = []
            try {
                ownedProjects = JSON.parse(ownedRaw)
            } catch (e) {
                // If parsing fails, treat as empty
                ownedProjects = []
            }

            let token: string | null = null
            for (const entry of ownedProjects) {
                if (typeof entry === 'string' && entry === id) {
                    // No token stored for legacy entries
                    token = null
                    break
                }
                if (entry && entry.id === id) {
                    token = entry.deletionToken || null
                    break
                }
            }

            // If token exists, include it in the Authorization header (safer than query param)
            const deleteUrl = `/api/projects/${id}`
            const headers: Record<string, string> = {}
            if (token) headers['Authorization'] = `Bearer ${token}`

            // If Turnstile site key is configured and we have a captcha token, include it
            const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
            if (turnstileSiteKey) {
                if (!cfTurnstileToken) {
                    setErrorMessage('Please complete the CAPTCHA to confirm deletion.')
                    setShowErrorModal(true)
                    setIsDeleting(false)
                    return
                }
                headers['cf-turnstile-token'] = cfTurnstileToken
            }

            const response = await fetch(deleteUrl, {
                method: 'DELETE',
                headers: headers,
            })

            if (!response.ok) {
                throw new Error('Failed to delete project')
            }

            // Remove from owned projects (support both string and object entries)
            try {
                const raw = localStorage.getItem('ownedProjects') || '[]'
                let stored: any[] = JSON.parse(raw)
                stored = stored.filter((entry: any) => {
                    if (typeof entry === 'string') return entry !== id
                    return entry.id !== id
                })
                localStorage.setItem('ownedProjects', JSON.stringify(stored))
            } catch (e) {
                // Fallback: remove by creating empty array
                localStorage.setItem('ownedProjects', JSON.stringify([]))
            }

            setShowDeleteModal(false)
            router.push('/editor')
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Failed to delete project')
            setShowErrorModal(true)
            setIsDeleting(false)
        }
    }

    const handleCancelDelete = () => {
        setShowDeleteModal(false)
        if (deleteModalRef.current) {
            deleteModalRef.current.checked = false
        }
    }

    const handleUpdateProject = async () => {
        try {
            setIsSaving(true)

            // Read deletion token from localStorage (ownedProjects may contain strings or objects)
            const ownedRaw = localStorage.getItem('ownedProjects') || '[]'
            let ownedProjects: any[] = []
            try {
                ownedProjects = JSON.parse(ownedRaw)
            } catch (e) {
                ownedProjects = []
            }

            let token: string | null = null
            for (const entry of ownedProjects) {
                if (typeof entry === 'string' && entry === id) {
                    // No token stored for legacy entries
                    token = null
                    break
                }
                if (entry && entry.id === id) {
                    token = entry.deletionToken || null
                    break
                }
            }

            // Update all files in the project
            const headers: Record<string, string> = { 'Content-Type': 'application/json' }
            if (token) headers['Authorization'] = `Bearer ${token}`

            const response = await fetch(`/api/projects/${id}/files`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ files: editedFiles }),
            })

            if (!response.ok) {
                throw new Error('Failed to update project')
            }

            // Reload project data
            const updatedResponse = await fetch(`/api/projects?id=${id}`)
            if (updatedResponse.ok) {
                const data = await updatedResponse.json()
                setProject(data)
            }

            setIsEditMode(false)
            setShowSuccessModal(true)
        } catch (err) {
            setErrorMessage(err instanceof Error ? err.message : 'Failed to update project')
            setShowErrorModal(true)
        } finally {
            setIsSaving(false)
        }
    }

    const handleFilesChange = (files: Array<any>) => {
        setEditedFiles(files)
    }

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-base-100">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
                <Footer />
            </div>
        )
    }

    if (error || !project) {
        return (
            <div className="flex flex-col min-h-screen bg-base-100">
                <Navbar />
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-error mb-4">Error</h1>
                        <p className="text-base-content/70 mb-6">{error || 'Project not found'}</p>
                        <Link href="/" className="btn btn-primary">
                            Go Home
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-base-100">
            <Navbar
                onEdit={() => {
                    setIsEditMode(true)
                    setEditedFiles(project.projectFiles || project.files || [])
                }}
                onDelete={() => setShowDeleteModal(true)}
                isDeleting={isDeleting}
                isEditMode={isEditMode}
                onCancelEdit={() => {
                    setIsEditMode(false)
                    setEditedFiles(project.projectFiles || project.files || [])
                }}
                onSaveEdit={handleUpdateProject}
                isSaving={isSaving}
            />

            <main className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-hidden bg-base-100 flex flex-col">
                    {/* outer metadata removed - header lives inside editor container for seamless rounding */}

                    {/* Main Editor Container */}
                    <div className="w-full flex-1 overflow-hidden rounded-2xl border border-base-300 shadow-lg flex flex-col bg-base-100">
                        {/* Main Editor Section */}
                        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                            {/* Project metadata header */}
                            <div className="flex items-center px-3 sm:px-4 py-0 bg-base-200/30 border-b border-base-300/50 overflow-x-auto overflow-y-visible gap-3 min-h-[48px]">
                                <div className="flex items-center min-w-0 gap-2">
                                    {/* Comments Sidebar Hamburger Button - Hidden when sidebar is open */}
                                    {!showCommentsSidebar && (
                                        <button
                                            onClick={() => setShowCommentsSidebar(true)}
                                            className="btn btn-ghost btn-sm rounded-lg flex-shrink-0"
                                            title="Open comments"
                                        >
                                            <svg
                                                className="w-5 h-5"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M4 6h16M4 12h16M4 18h16"
                                                />
                                            </svg>
                                        </button>
                                    )}
                                    <h1 className="text-lg sm:text-xl font-semibold truncate">{project.title}</h1>
                                    {project.description && (
                                        <span className="text-sm text-base-content/60 hidden md:inline truncate max-w-md">{project.description}</span>
                                    )}
                                </div>

                                <div className="ml-auto flex items-center gap-2 text-sm text-base-content/70">
                                    <span className="badge badge-ghost badge-sm flex items-center gap-2">
                                        <span aria-hidden>📊</span>
                                        <span>{(project.views ?? 0) === 1 ? '1 view' : `${project.views ?? 0} views`}</span>
                                    </span>

                                    <span className="badge badge-ghost badge-sm flex items-center gap-2">
                                        <span aria-hidden>📁</span>
                                        <span>{(project.projectFiles || project.files || []).length} {(project.projectFiles || project.files || []).length === 1 ? 'file' : 'files'}</span>
                                    </span>

                                    <span className={`badge badge-sm ${project.isPublic ? 'badge-primary' : 'badge-outline'}`}>
                                        {project.isPublic ? 'Public' : 'Private'}
                                    </span>
                                    {project.expirationDays !== undefined && project.expirationDays !== null && (
                                        <ExpirationDisplay createdAt={project.createdAt} expirationDays={project.expirationDays} />
                                    )}

                                    {/* View Changes Modal Button */}
                                    <button
                                        onClick={() => setShowChangesModal(true)}
                                        className="btn btn-ghost btn-sm rounded-lg"
                                        aria-label="View changes"
                                        title="View changes"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 relative">
                                <MultiFileEditor
                                    ref={multiFileEditorRef}
                                    initialFiles={isEditMode ? editedFiles : (project.projectFiles || project.files || [])}
                                    isReadOnly={!isEditMode}
                                    onFilesChange={isEditMode ? handleFilesChange : undefined}
                                    onActiveFileChange={setActiveFilePath}
                                    onHighlightLine={handleHighlightLine}
                                />
                            </div>
                        </div>


                    </div>
                </div>
            </main>

            <Footer />

            {/* Changes Modal */}
            <dialog ref={changesModalRef} className="modal">
                <div className="modal-box w-11/12 max-w-5xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                    {/* Modal Header */}
                    <div className="border-b border-base-300 bg-base-100 px-6 py-4">
                        <h3 className="font-bold text-lg">📝 Changes</h3>
                    </div>

                    {/* Modal Content */}
                    <div className="flex-1 overflow-y-auto px-6 py-4">
                        <div className="space-y-6">
                            {(project?.projectFiles || project?.files || []).map((file: any) => (
                                <DiffViewer
                                    key={file.path}
                                    oldContent={null}
                                    newContent={file.code}
                                    filePath={file.path}
                                    isCollapsed={false}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Modal Action */}
                    <div className="border-t border-base-300 bg-base-100 px-6 py-3 flex justify-end">
                        <button
                            onClick={() => setShowChangesModal(false)}
                            className="btn btn-ghost btn-sm"
                        >
                            Close
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </dialog>

            {/* Comments Sidebar */}
            <div className={`fixed left-0 top-0 h-screen w-80 bg-base-100 border-r border-base-300 shadow-xl transform transition-transform duration-300 ease-in-out z-40 ${showCommentsSidebar ? 'translate-x-0' : '-translate-x-full'
                }`}>
                {/* Sidebar Header */}
                <div className="border-b border-base-300 px-4 py-4 flex items-center justify-between sticky top-0 bg-base-100 z-10">
                    <h2 className="font-bold text-lg">💬 Comments</h2>
                    <button
                        onClick={() => setShowCommentsSidebar(false)}
                        className="btn btn-ghost btn-sm rounded-lg"
                        title="Close comments"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* Comments Content */}
                <div className="overflow-y-auto h-[calc(100vh-70px)]">
                    <CommentsPanel
                        projectId={id}
                        isReadOnly={false}
                        activeFilePath={activeFilePath}
                        onHighlightLine={handleHighlightLine}
                        deleteModalRef={deleteCommentModalRef}
                        onDeleteComment={setDeleteCommentId}
                    />
                </div>
            </div>

            {/* Sidebar Overlay/Backdrop */}
            {showCommentsSidebar && (
                <div
                    className="fixed inset-0 bg-black/20 z-30 lg:hidden"
                    onClick={() => setShowCommentsSidebar(false)}
                />
            )}

            {/* Delete Confirmation Modal */}
            <input
                ref={deleteModalRef}
                type="checkbox"
                id="delete_project_modal"
                className="modal-toggle"
            />
            <div className="modal">
                <div className="modal-box rounded-2xl">
                    <h3 className="font-bold text-lg">Delete Project?</h3>
                    <p className="py-4 text-base-content/70">
                        Are you sure you want to delete this project? This action cannot be undone.
                    </p>
                    {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
                        <div className="mt-4 flex flex-col items-center gap-2">
                            <p className="text-sm text-base-content/60">Please complete the CAPTCHA to confirm deletion.</p>
                            <div id="turnstile-container" className="mx-auto" />
                        </div>
                    )}
                    <div className="modal-action">
                        <button
                            onClick={handleCancelDelete}
                            className="btn btn-ghost rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteProject}
                            disabled={isDeleting || (turnstileSiteKey ? !cfTurnstileToken : false)}
                            className="btn btn-error text-white rounded-xl"
                        >
                            {isDeleting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Deleting...
                                </>
                            ) : turnstileSiteKey && !cfTurnstileToken ? (
                                'Complete CAPTCHA'
                            ) : (
                                <div className='flex sm:flex-row items-center gap-1'>
                                    <TrashIcon className='size-6' />

                                    <span>Delete</span>
                                </div>
                            )}
                        </button>
                    </div>
                </div>
                <label
                    className="modal-backdrop"
                    htmlFor="delete_project_modal"
                    onClick={handleCancelDelete}
                />
            </div>

            {/* Success Modal */}
            <dialog ref={successModalRef} className="modal">
                <div className="modal-box w-full sm:max-w-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-success/20">
                            <span className="text-2xl">✓</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-base-content">Success!</h3>
                            <p className="text-sm text-base-content/60">Your project has been updated</p>
                        </div>
                    </div>
                    <div className="divider my-2"></div>
                    <p className="text-base-content/70 mb-4">
                        Your changes have been saved successfully. The updated code is now available at the same share link.
                    </p>
                    <div className="modal-action">
                        <button
                            onClick={() => {
                                setShowSuccessModal(false)
                                successModalRef.current?.close()
                            }}
                            className="btn btn-primary rounded-xl w-full"
                        >
                            Done
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={() => setShowSuccessModal(false)}>close</button>
                </form>
            </dialog>

            <ErrorModal open={showErrorModal} title="Error" message={errorMessage} onClose={() => setShowErrorModal(false)} />

            {/* Delete Comment Modal */}
            <dialog ref={deleteCommentModalRef} className="modal">
                <div className="modal-box">
                    <h3 className="font-bold text-lg">Delete Comment?</h3>
                    <p className="py-4 text-base-content/70">
                        Are you sure you want to delete this comment? This action cannot be undone.
                    </p>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-ghost rounded-xl">Cancel</button>
                        </form>
                        <button
                            onClick={async () => {
                                if (deleteCommentId) {
                                    try {
                                        setDeletingCommentId(deleteCommentId)
                                        const response = await fetch(`/api/projects/${id}/comments/${deleteCommentId}`, {
                                            method: 'DELETE',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({}),
                                        })
                                        if (!response.ok) throw new Error('Failed to delete comment')
                                        setDeleteCommentId(null)
                                        setDeletingCommentId(null)
                                        deleteCommentModalRef.current?.close()
                                    } catch (err) {
                                        console.error('Delete error:', err)
                                        setDeletingCommentId(null)
                                    }
                                }
                            }}
                            disabled={deletingCommentId !== null}
                            className="btn btn-error text-white rounded-xl"
                        >
                            {deletingCommentId ? (
                                <>
                                    <span className="loading loading-spinner loading-xs"></span>
                                    Deleting...
                                </>
                            ) : (
                                'Delete'
                            )}
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button />
                </form>
            </dialog>
        </div>
    )
}
