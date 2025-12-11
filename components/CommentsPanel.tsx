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
    files?: Array<{ path: string; code: string }>
}

export default function CommentsPanel({
    projectId,
    isReadOnly = false,
    activeFilePath,
    onHighlightLine,
    deleteModalRef: externalDeleteModalRef,
    onDeleteComment,
    files = [],
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
    const [lastCommentTime, setLastCommentTime] = useState<number>(0)
    const [rateLimitCountdown, setRateLimitCountdown] = useState<number>(0)
    const RATE_LIMIT_SECONDS = 3 // 1 comment per 3 seconds

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

    // Countdown timer for rate limiting
    useEffect(() => {
        if (rateLimitCountdown <= 0) return

        const interval = setInterval(() => {
            setRateLimitCountdown((prev) => Math.max(0, prev - 1))
        }, 1000)

        return () => clearInterval(interval)
    }, [rateLimitCountdown])

    const handleAddComment = async (e: React.FormEvent) => {
        e.preventDefault()

        // Check rate limiting
        if (rateLimitCountdown > 0) {
            setError(`Please wait ${rateLimitCountdown} second${rateLimitCountdown !== 1 ? 's' : ''} before posting another comment`)
            return
        }

        if (!newComment.trim()) {
            setError('Comment cannot be empty')
            return
        }

        if (!username.trim()) {
            setError('Please enter your name')
            return
        }

        // Validate line number if a file and line are referenced
        if (filePath.trim() && lineNumber) {
            if (!isValidLineNumber(filePath.trim(), lineNumber)) {
                const fileObj = files.find((f) => f.path === filePath.trim())
                if (!fileObj) {
                    setError(`File "${filePath}" not found`)
                } else {
                    const maxLine = fileObj.code.split('\n').length
                    setError(`Line ${lineNumber} does not exist (file has ${maxLine} lines)`)
                }
                return
            }
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

                // Handle rate limiting from server
                if (response.status === 429) {
                    const retryAfter = errorData.retryAfter || RATE_LIMIT_SECONDS
                    setRateLimitCountdown(retryAfter)
                    throw new Error(errorData.error || `Please wait ${retryAfter} seconds before posting`)
                }

                throw new Error(errorData.error || 'Failed to post comment')
            }

            const comment = await response.json()
            console.log('Posted comment:', comment)
            setComments([comment, ...comments])
            setNewComment('')
            setLineNumber(null)
            // Don't clear filePath - let it stay as the current file reference

            // Set rate limit countdown
            setLastCommentTime(Date.now())
            setRateLimitCountdown(RATE_LIMIT_SECONDS)
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
            const date = new Date(dateString)
            return date.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
            })
        } catch {
            return dateString
        }
    }

    // Validate that a line number exists in the file
    const isValidLineNumber = (file: string, line: number | null): boolean => {
        if (!line || line < 1) return true // null or 0 is valid (no line reference)
        const fileObj = files.find((f) => f.path === file)
        if (!fileObj) return false // file doesn't exist
        const lineCount = fileObj.code.split('\n').length
        return line <= lineCount
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
                                onChange={(e) => {
                                    const value = e.target.value
                                    if (value === '') {
                                        setLineNumber(null)
                                    } else {
                                        const num = parseInt(value, 10)
                                        if (!isNaN(num) && num > 0) {
                                            setLineNumber(num)
                                        }
                                    }
                                }}
                                className="input input-xs input-bordered w-24"
                                min="1"
                                inputMode="numeric"
                                pattern="[0-9]*"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !newComment.trim() || rateLimitCountdown > 0}
                        className="btn btn-xs btn-primary w-full"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="loading loading-spinner loading-xs"></span>
                                Posting...
                            </>
                        ) : rateLimitCountdown > 0 ? (
                            `Wait ${rateLimitCountdown}s...`
                        ) : (
                            'Post Comment'
                        )}
                    </button>
                </form>
            )}
            <div className="px-4 py-3 border-b border-base-300 bg-base-100">
                <h2 className="font-bold text-sm flex items-center gap-2 text-base-content/80">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                    <span>
                        {comments.length} {comments.length === 1 ? 'comment' : 'comments'}
                    </span>
                </h2>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
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
                    <div className="space-y-4">
                        {comments.map((comment) => (
                            <div key={comment.id} className="chat chat-start">
                                {/* Avatar */}
                                <div className="chat-image avatar">
                                    <div className="w-8 sm:w-10 rounded-full bg-primary flex items-center justify-center text-primary-content text-xs sm:text-sm font-bold">
                                        {(comment.authorName || 'A').charAt(0).toUpperCase()}
                                    </div>
                                </div>

                                {/* Header with Name and Time */}
                                <div className="chat-header flex items-center gap-2 whitespace-nowrap overflow-hidden">
                                    <span className="font-semibold">{comment.authorName}</span>
                                    <time className="text-xs opacity-50">{formatDate(comment.createdAt)}</time>
                                </div>

                                {/* Chat Bubble */}
                                <div className="chat-bubble bg-base-200 text-base-content text-sm sm:text-base">
                                    {/* File/Line References */}
                                    {(comment.filePath || comment.line) && (
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            {comment.filePath && (
                                                <button
                                                    onClick={() => onHighlightLine?.(comment.filePath!, comment.line || 1)}
                                                    className="badge badge-sm badge-primary text-[11px] font-mono hover:badge-primary/80 cursor-pointer transition-all"
                                                    title="Click to highlight in editor"
                                                >
                                                    {comment.filePath.split('/').pop()}
                                                </button>
                                            )}
                                            {comment.line && (
                                                <button
                                                    onClick={() => onHighlightLine?.(comment.filePath || '', comment.line!)}
                                                    className="badge badge-sm badge-secondary text-[11px] font-mono hover:badge-secondary/80 cursor-pointer transition-all"
                                                    title="Click to highlight in editor"
                                                >
                                                    Line {comment.line}
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* Content */}
                                    <p className="break-words leading-relaxed whitespace-pre-wrap">
                                        {comment.content}
                                    </p>
                                </div>

                                {/* Footer */}
                                <div className="chat-footer opacity-50 text-xs">Sent</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
