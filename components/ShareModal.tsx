'use client'

import React, { useRef, useEffect, useState } from 'react'

// Client-only small component to compute and display expiration timestamp (days)
function ExpirationTimestamp({ expirationDays, isOpen }: { expirationDays: number | null | undefined; isOpen: boolean }) {
    const [info, setInfo] = useState<{ pretty: string; duration: string } | null>(null)

    const compute = () => {
        const effectiveDays = expirationDays != null ? expirationDays : 7
        const remainingMs = effectiveDays * 24 * 60 * 60 * 1000
        const expDate = new Date(Date.now() + remainingMs)
        const pretty = expDate.toLocaleString(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        })

        const minsLeft = Math.max(0, Math.floor(remainingMs / 60000))
        let duration = ''
        if (minsLeft <= 0) {
            duration = 'Expires now'
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
    }

    useEffect(() => {
        compute()
        const intervalMs = isOpen ? 1000 : 30000
        const id = setInterval(compute, intervalMs)
        return () => clearInterval(id)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [expirationDays, isOpen])

    if (!info) return <p className="text-xs text-base-content/50 mt-1">&nbsp;</p>

    return (
        <div>
            <p className="text-xs text-base-content/60 mt-1">{info.duration}</p>
            <p className="text-xs text-base-content/50 mt-0">{info.pretty}</p>
        </div>
    )
}

interface ShareModalProps {
    isOpen: boolean
    onClose: () => void
    shareUrl: string
    title?: string
    description?: string
    isPublic?: boolean
    expirationDays?: number | null
    onExpirationChange?: (days: number | null) => void
    onNew?: () => void
}

export default function ShareModal({
    isOpen,
    onClose,
    shareUrl,
    title,
    description,
    isPublic,
    expirationDays,
    onExpirationChange,
    onNew
}: ShareModalProps) {
    const shareModalRef = useRef<HTMLDialogElement>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        if (shareModalRef.current) {
            if (isOpen) {
                shareModalRef.current.showModal()
            } else {
                shareModalRef.current.close()
            }
        }
    }, [isOpen])

    // expiration UI removed from modal

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleNewPaste = () => {
        onClose()
        onNew?.()
    }

    const handleCancel = () => {
        // Reset expiration when user cancels/closes the share modal
        onExpirationChange?.(null)
        onClose()
    }

    return (
        <>
            <dialog
                ref={shareModalRef}
                className="modal"
            >
                <form method="dialog" className="modal-box rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-2xl">🎉</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-2xl text-base-content">Saved!</h3>
                            <p className="text-sm text-base-content/60">Your code is ready to share</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="divider my-0"></div>

                        {/* Paste Info */}
                        <div className="bg-base-200 rounded-lg p-4 space-y-3">
                            <div>
                                <p className="text-xs text-base-content/60 font-semibold">SNIPPET</p>
                                <p className="text-sm font-semibold truncate">{title || 'Untitled'}</p>
                            </div>
                            {description && (
                                <div>
                                    <p className="text-xs text-base-content/60 font-semibold">DESCRIPTION</p>
                                    <p className="text-sm truncate">{description}</p>
                                </div>
                            )}
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-semibold text-base-content/60">VISIBILITY:</span>
                                <span className={isPublic ? 'text-success' : 'text-warning'}>
                                    {isPublic ? '🌐 Public' : '🔒 Private'}
                                </span>
                            </div>

                            {/* Expiration summary (live-updating). */}
                            <div className="pl-4">
                                <ExpirationTimestamp expirationDays={expirationDays} isOpen={isOpen} />
                            </div>
                        </div>

                        {/* Share Link */}
                        <div>
                            <p className="text-xs text-base-content/60 font-semibold mb-2">SHARE LINK</p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={shareUrl}
                                    className="input input-bordered input-sm flex-1 rounded-lg text-xs font-mono"
                                />
                                <button
                                    onClick={handleCopyLink}
                                    className="btn btn-sm btn-primary rounded-xl gap-1"
                                >
                                    {copied ? '✅ Copied' : '📋 Copy'}
                                </button>
                            </div>
                        </div>

                        {/* View Button */}
                        <a
                            href={shareUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn-ghost w-full rounded-xl gap-2"
                        >
                            👁️ View Paste
                        </a>

                        <div className="divider my-2"></div>

                        {/* Actions */}
                        <div className="modal-action gap-2 justify-between">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="btn btn-sm btn-ghost rounded-xl"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={handleNewPaste}
                                className="btn btn-sm btn-primary rounded-xl gap-1"
                            >
                                ✨ New Paste
                            </button>
                        </div>
                    </div>
                </form>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={handleCancel} />
                </form>
            </dialog>

            {/* expiration modal removed - controlled via Save/Share flow elsewhere if needed */}
        </>
    )
}
