'use client'

import React, { useRef, useEffect, useState } from 'react'

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
    const shareModalRef = useRef<HTMLInputElement>(null)
    const [copied, setCopied] = useState(false)
    const [selectedExpiration, setSelectedExpiration] = useState<number | null>(expirationDays || null)

    useEffect(() => {
        if (shareModalRef.current) {
            shareModalRef.current.checked = isOpen
        }
    }, [isOpen])

    useEffect(() => {
        setSelectedExpiration(expirationDays || null)
    }, [expirationDays])

    const handleExpirationChange = (days: number | null) => {
        setSelectedExpiration(days)
        onExpirationChange?.(days)
    }

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleNewPaste = () => {
        onClose()
        if (shareModalRef.current) {
            shareModalRef.current.checked = false
        }
        onNew?.()
    }

    return (
        <>
            <input
                ref={shareModalRef}
                type="checkbox"
                id="share_modal"
                className="modal-toggle"
            />
            <div className="modal">
                <div className="modal-box w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <span className="text-4xl">🎉</span>
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

                            {/* Expiration Option */}
                            <div className="space-y-2">
                                <label className="text-xs text-base-content/60 font-semibold">EXPIRATION</label>
                                <select
                                    value={selectedExpiration || ''}
                                    onChange={(e) => handleExpirationChange(e.target.value ? parseInt(e.target.value) : null)}
                                    className="select select-sm w-full rounded-lg border-base-300 bg-base-100"
                                >
                                    <option value="">Never</option>
                                    <option value="1">1 day</option>
                                    <option value="3">3 days</option>
                                    <option value="7">7 days</option>
                                </select>
                                {selectedExpiration && (
                                    <p className="text-xs text-info/80">
                                        ⏱️ Expires in {selectedExpiration} day{selectedExpiration > 1 ? 's' : ''}
                                    </p>
                                )}
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
                                onClick={() => {
                                    onClose()
                                    if (shareModalRef.current) {
                                        shareModalRef.current.checked = false
                                    }
                                }}
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
                </div>
                <label
                    className="modal-backdrop"
                    htmlFor="share_modal"
                    onClick={onClose}
                ></label>
            </div>
        </>
    )
}
