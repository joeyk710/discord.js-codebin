'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MultiFileEditor from '@/components/MultiFileEditor'
import Footer from '@/components/Footer'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import Link from 'next/link'
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
    const errorModalRef = useRef<HTMLDialogElement>(null)
    const [cfTurnstileToken, setCfTurnstileToken] = useState<string | null>(null)
    const widgetIdRef = useRef<number | null>(null)
    const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY

    useEffect(() => {
        async function loadProject() {
            try {
                setLoading(true)
                const response = await fetch(`/api/projects?id=${id}`)
                if (!response.ok) {
                    throw new Error('Failed to load project')
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

    // Control error modal
    useEffect(() => {
        if (showErrorModal && errorModalRef.current) {
            errorModalRef.current.showModal()
        }
    }, [showErrorModal])

    // Load Cloudflare Turnstile widget when delete modal is shown (if configured)
    useEffect(() => {
        const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
        if (!showDeleteModal || !siteKey) return

        let mounted = true

        const loadAndRender = async () => {
            try {
                if (!(window as any).turnstile) {
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
                if (container && (window as any).turnstile && widgetIdRef.current == null && mounted) {
                    try {
                        widgetIdRef.current = (window as any).turnstile.render(container, {
                            sitekey: siteKey,
                            callback: (token: string) => setCfTurnstileToken(token),
                            'expired-callback': () => setCfTurnstileToken(null),
                        })
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

            // Update all files in the project
            const response = await fetch(`/api/projects/${id}/files`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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

                    {/* Content Container */}
                    <div className="w-full flex-1 flex flex-col overflow-hidden">
                        {/* Editor (with internal metadata header so rounding is seamless) */}
                        <div className="flex-1 overflow-hidden rounded-xl border border-base-300 min-h-0 relative flex flex-col">
                            {/* Project metadata header placed inside rounded container */}
                            <div className="flex items-center px-3 sm:px-4 py-0 bg-base-200/50 backdrop-blur-sm border-b border-base-300/30 overflow-x-auto overflow-y-visible gap-3 min-h-[48px]">
                                <div className="flex items-center min-w-0 gap-4">
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
                                </div>
                            </div>

                            <div className="flex-1 relative">
                                <MultiFileEditor
                                    initialFiles={isEditMode ? editedFiles : (project.projectFiles || project.files || [])}
                                    isReadOnly={!isEditMode}
                                    onFilesChange={isEditMode ? handleFilesChange : undefined}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />

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
                            className="btn btn-error rounded-xl"
                        >
                            {isDeleting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Deleting...
                                </>
                            ) : turnstileSiteKey && !cfTurnstileToken ? (
                                'Complete CAPTCHA'
                            ) : (
                                '🗑️ Delete'
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

            {/* Error Modal */}
            <dialog ref={errorModalRef} className="modal">
                <div className="modal-box w-full sm:max-w-md">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-error/20">
                            <span className="text-2xl">✕</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-base-content">Error</h3>
                            <p className="text-sm text-base-content/60">Failed to update project</p>
                        </div>
                    </div>
                    <div className="divider my-2"></div>
                    <p className="text-base-content/70 mb-4">
                        {errorMessage}
                    </p>
                    <div className="modal-action">
                        <button
                            onClick={() => {
                                setShowErrorModal(false)
                                errorModalRef.current?.close()
                            }}
                            className="btn btn-ghost rounded-xl w-full"
                        >
                            Close
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={() => setShowErrorModal(false)}>close</button>
                </form>
            </dialog>
        </div>
    )
}
