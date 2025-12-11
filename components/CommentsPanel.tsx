'use client'

import React, { useState, useEffect, useRef } from 'react'
import { getBrowserId, getBrowserName, setBrowserName } from '@/lib/auth'
import { useCurrentUser } from '@/lib/useCurrentUser'

interface Comment {
    id: string
    projectId: string
    browserId?: string | null
    line?: number | null
    filePath?: string | null
    authorName: string
    content: string
    createdAt: string
    updatedAt: string
}

interface CommentsPanelProps {
    projectId: string
    isReadOnly?: boolean
    activeFilePath?: string
    onHighlightLine?: (filePath: string, lineNumber: number) => void
    deleteModalRef?: React.RefObject<HTMLDialogElement | null>
    onDeleteComment?: (commentId: string) => void
}

export default function CommentsPanel({
    projectId,
    isReadOnly = false,
    activeFilePath,
    onHighlightLine,
    deleteModalRef: externalDeleteModalRef,
    onDeleteComment,
}: CommentsPanelProps) {
    const currentUser = useCurrentUser()
    const [comments, setComments] = useState<Comment[]>([])
    const [loading, setLoading] = useState(true)
    const [newComment, setNewComment] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [browserId, setBrowserId] = useState('')
    const [username, setUsername] = useState(getBrowserName())
    const [lineNumber, setLineNumber] = useState<number | null>(null)
    const [filePath, setFilePath] = useState(activeFilePath || '')
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

    // Initialize browser ID
    useEffect(() => {
        setBrowserId(getBrowserId())
    }, [])

    // Auto-update file path when active file changes
    useEffect(() => {
        if (activeFilePath) {
            setFilePath(activeFilePath)
        }
    }, [activeFilePath])

    // Fetch comments
    useEffect(() => {
        async function fetchComments() {
            try {
                setLoading(true)
                const response = await fetch(`/api/projects/${projectId}/comments`)
                if (!response.ok) throw new Error('Failed to fetch comments')
                const data = await response.json()
                setComments(data)
            } catch (err) {
                console.error('Error fetching comments:', err)
                setError(err instanceof Error ? err.message : 'Failed to load comments')
            } finally {
                setLoading(false)
            }
        }

        fetchComments()
    }, [projectId])

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!newComment.trim()) {
            setError('Comment cannot be empty')
            return
        }

        if (!username.trim()) {
            setError('Please enter your name')
            return
        }

        try {
            setIsSubmitting(true)
            setError(null)

            // Save username to localStorage
            setBrowserName(username)

            const response = await fetch(`/api/projects/${projectId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    browserId: browserId,
                    username: username.trim(),
                    avatar: null,
                    content: newComment.trim(),
                    line: lineNumber || null,
                    filePath: filePath.trim() || null,
                }),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error('Comment submission error:', errorData)
                throw new Error(errorData.error || 'Failed to post comment')
            }

            const comment = await response.json()
            console.log('Posted comment:', comment)
            setComments([comment, ...comments])
            setNewComment('')
            setLineNumber(null)
            // Don't clear filePath - let it stay as the current file reference
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to post comment'
            console.error('Comment error:', message)
            setError(message)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteComment = async (commentId: string) => {
        if (!confirm('Are you sure you want to delete this comment?')) return

        try {
            setDeletingId(commentId)
            setError(null)

            const response = await fetch(`/api/projects/${projectId}/comments/${commentId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ browserId }),
            })

            if (!response.ok) {
                const data = await response.json()
                throw new Error(data.error || 'Failed to delete comment')
            }

            setComments(comments.filter((c) => c.id !== commentId))
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete comment'
            setError(message)
        } finally {
            setDeletingId(null)
        }
    }

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            })
        } catch {
            return dateString
        }
    }

    return (
        <div className="flex flex-col h-full w-full bg-base-100">
            {/* Add Comment Form - Top */}
            {!isReadOnly && (
                <form onSubmit={handleAddComment} className="border-b border-base-300 p-4 space-y-2 bg-base-50">
                    {error && (
                        <div className="alert alert-error alert-sm py-2 px-3">
                            <svg
                                className="w-4 h-4 shrink-0"
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
                            <span className="text-xs">{error}</span>
                        </div>
                    )}

                    {/* Username Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-base-content/70">Your Name</label>
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input input-xs input-bordered w-full"
                            maxLength={50}
                        />
                    </div>

                    <textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="textarea textarea-xs textarea-bordered w-full resize-none"
                        rows={2}
                        maxLength={1000}
                    />

                    {/* Line Reference Section */}
                    <div className="bg-base-200/50 rounded p-3 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-base-content/70">
                                Reference (optional)
                            </label>
                            {(filePath || lineNumber) && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setFilePath('')
                                        setLineNumber(null)
                                    }}
                                    className="btn btn-ghost btn-xs text-xs"
                                >
                                    Clear
                                </button>
                            )}
                        </div>

                        {/* Current Reference Display */}
                        {(filePath || lineNumber) && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {filePath && (
                                    <span className="badge badge-sm badge-primary text-[11px] font-mono">
                                        {filePath.split('/').pop()}
                                    </span>
                                )}
                                {lineNumber && (
                                    <span className="badge badge-sm badge-secondary text-[11px] font-mono">
                                        Line {lineNumber}
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Input Fields */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="File path"
                                value={filePath}
                                onChange={(e) => setFilePath(e.target.value)}
                                className="input input-xs input-bordered flex-1 min-w-32"
                            />
                            <input
                                type="number"
                                placeholder="Line #"
                                value={lineNumber || ''}
                                onChange={(e) =>
                                    setLineNumber(e.target.value ? parseInt(e.target.value) : null)
                                }
                                className="input input-xs input-bordered w-24"
                                min="1"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !newComment.trim()}
                        className="btn btn-xs btn-primary w-full"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="loading loading-spinner loading-xs"></span>
                                Posting...
                            </>
                        ) : (
                            'Post Comment'
                        )}
                    </button>
                </form>
            )}
            <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                <h2 className="font-bold text-sm flex items-center gap-2 text-base-content/80">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 8h10M7 12h4m1 8l-4-2H5a2 2 0 01-2-2V6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2h-2.172a2 2 0 00-1.414.586l-4.414 4.414z"
                        />
                    </svg>
                    <span>
                        {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                    </span>
                </h2>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="loading loading-spinner loading-sm"></div>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="text-center py-12 text-base-content/50">
                        <p className="text-sm">No comments yet</p>
                        <p className="text-xs mt-1">Be the first to share feedback!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {comments.map((comment) => (
                            <div key={comment.id} className="chat chat-start group">
                                {/* Avatar */}
                                <div className="chat-image avatar">
                                    <div className="w-8 rounded-full bg-primary flex items-center justify-center text-primary-content text-xs font-bold">
                                        {(comment.authorName || 'A').charAt(0).toUpperCase()}
                                    </div>
                                </div>

                                {/* Chat Bubble */}
                                <div className="chat-bubble bg-primary text-primary-content p-0 flex flex-col">
                                    {/* Header */}
                                    <div className="px-4 pt-3 pb-1">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold text-sm">
                                                {comment.authorName}
                                            </p>
                                            <p className="text-xs opacity-75">{formatDate(comment.createdAt)}</p>
                                        </div>
                                        {(comment.filePath || comment.line) && (
                                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                                {comment.filePath && (
                                                    <button
                                                        onClick={() => onHighlightLine?.(comment.filePath!, comment.line || 1)}
                                                        className="badge badge-outline badge-sm text-[11px] font-mono bg-white/10 border-white/40 text-white hover:bg-white/20 hover:border-white/60 cursor-pointer transition-all"
                                                        title="Click to highlight in editor"
                                                    >
                                                        <span className="mr-1">📄</span>
                                                        {comment.filePath.split('/').pop()}
                                                    </button>
                                                )}
                                                {comment.line && (
                                                    <button
                                                        onClick={() => onHighlightLine?.(comment.filePath || '', comment.line!)}
                                                        className="badge badge-outline badge-sm text-[11px] font-mono bg-white/10 border-white/40 text-white hover:bg-white/20 hover:border-white/60 cursor-pointer transition-all"
                                                        title="Click to highlight in editor"
                                                    >
                                                        <span className="mr-1">📍</span>
                                                        Line {comment.line}
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="px-4 pb-3 pt-1">
                                        <p className="text-sm break-words leading-relaxed whitespace-pre-wrap">
                                            {comment.content}
                                        </p>
                                    </div>

                                    {/* Footer - Delete Button */}
                                    {currentUser && comment.browserId === currentUser.userId && !isReadOnly && (
                                        <div className="px-4 pb-2 pt-0">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    onDeleteComment?.(comment.id)
                                                    externalDeleteModalRef?.current?.showModal()
                                                }}
                                                disabled={deletingId === comment.id}
                                                className="btn btn-ghost btn-xs gap-1 text-error hover:text-error-content hover:bg-error/20"
                                                title="Delete comment"
                                            >
                                                <svg
                                                    className="w-3 h-3"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                    />
                                                </svg>
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
