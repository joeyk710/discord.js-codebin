'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import MultiFileEditor from '@/components/MultiFileEditor'
import Footer from '@/components/Footer'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import Link from 'next/link'

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

    const handleDeleteProject = async () => {
        try {
            setIsDeleting(true)
            const response = await fetch(`/api/projects/${id}`, {
                method: 'DELETE',
            })

            if (!response.ok) {
                throw new Error('Failed to delete project')
            }

            // Remove from owned projects
            const ownedProjects = JSON.parse(localStorage.getItem('ownedProjects') || '[]')
            const updatedProjects = ownedProjects.filter((projectId: string) => projectId !== id)
            localStorage.setItem('ownedProjects', JSON.stringify(updatedProjects))

            setShowDeleteModal(false)
            router.push('/editor')
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to delete project')
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
            <Navbar />

            <main className="flex-1 overflow-hidden flex flex-col m-1 sm:m-3">
                <div className="flex-1 overflow-hidden rounded-2xl shadow-xl bg-base-100 flex flex-col">
                    {/* Project Header */}
                    <div className="bg-base-200 border-b border-base-300 px-4 py-3 sm:px-6 sm:py-4 flex-shrink-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-2xl sm:text-3xl font-bold text-base-content mb-2">
                                    {project.title}
                                </h1>
                                {project.description && (
                                    <p className="text-base-content/70 text-sm mb-3">{project.description}</p>
                                )}
                                <div className="flex gap-3 text-xs sm:text-sm text-base-content/60 flex-wrap">
                                    <span>📊 {project.views} views</span>
                                    <span>📁 {(project.projectFiles || project.files || []).length} files</span>
                                    <span>
                                        🔒 {project.isPublic ? 'Public' : 'Private'}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                {!isEditMode ? (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsEditMode(true)
                                                setEditedFiles(project.projectFiles || project.files || [])
                                            }}
                                            className="btn btn-sm btn-primary rounded-xl"
                                            title="Edit project"
                                        >
                                            <span className="hidden sm:inline">✏️ Edit</span>
                                            <span className="sm:hidden">✏️</span>
                                        </button>
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
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
                                            onClick={() => setIsEditMode(false)}
                                            disabled={isSaving}
                                            className="btn btn-sm btn-ghost rounded-xl"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleUpdateProject}
                                            disabled={isSaving}
                                            className="btn btn-sm btn-primary rounded-xl"
                                            title="Update and save project"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <span className="loading loading-spinner loading-sm"></span>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <span className="hidden sm:inline">💾 Update & Save</span>
                                                    <span className="sm:hidden">💾</span>
                                                </>
                                            )}
                                        </button>
                                    </>
                                )}
                                <ThemeSwitcher />
                            </div>
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="flex-1 overflow-hidden">
                        <MultiFileEditor
                            initialFiles={isEditMode ? editedFiles : (project.projectFiles || project.files || [])}
                            isReadOnly={!isEditMode}
                            onFilesChange={isEditMode ? handleFilesChange : undefined}
                        />
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
                    <div className="modal-action">
                        <button
                            onClick={handleCancelDelete}
                            className="btn btn-ghost rounded-xl"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDeleteProject}
                            disabled={isDeleting}
                            className="btn btn-error rounded-xl"
                        >
                            {isDeleting ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Deleting...
                                </>
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
