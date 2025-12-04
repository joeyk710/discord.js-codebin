'use client'

import React, { useRef, useEffect, useState } from 'react'

// Client-only small component to compute and display expiration timestamp
function ExpirationTimestamp({ expirationMinutes, isOpen }: { expirationMinutes: number | null; isOpen: boolean }) {
  const [info, setInfo] = useState<{ pretty: string; duration: string } | null>(null)

  const compute = () => {
    const effectiveMinutes = expirationMinutes !== null ? expirationMinutes : 7 * 24 * 60
    // remaining milliseconds until expiration from now
    const remainingMs = effectiveMinutes * 60 * 1000
    const expDate = new Date(Date.now() + remainingMs)
    const pretty = expDate.toLocaleString(undefined, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })

    // compute remaining minutes (rounded down)
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
    // compute immediately
    compute()

    // when modal is open, refresh more frequently (every 1s). When closed, refresh every 30s to keep UI reasonably current.
    const intervalMs = isOpen ? 1000 : 30000
    const id = setInterval(compute, intervalMs)
    return () => clearInterval(id)
  }, [expirationMinutes, isOpen])

  if (!info) return <p className="text-xs text-base-content/50 mt-1">&nbsp;</p>

  return (
    <div>
      <p className="text-xs text-base-content/60 mt-1">{info.duration}</p>
      <p className="text-xs text-base-content/50 mt-0">{info.pretty}</p>
    </div>
  )
}
import ExpirationInput from './ExpirationInput'
import ExpirationModal from './ExpirationModal'

interface SaveModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (metadata: { isPublic: boolean; expirationMinutes?: number }) => void
  isSaving: boolean
}

export default function SaveModal({ isOpen, onClose, onSave, isSaving }: SaveModalProps) {
  const [isPublic, setIsPublic] = React.useState(true)
  const [expirationMinutes, setExpirationMinutes] = React.useState<number | null>(null)
  const [expirationError, setExpirationError] = React.useState<string>('')
  const [showExpirationModal, setShowExpirationModal] = React.useState(false)
  const saveModalRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (saveModalRef.current) {
      if (isOpen) {
        saveModalRef.current.showModal()
      } else {
        saveModalRef.current.close()
      }
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Validate expiration
    if (expirationMinutes !== null && expirationMinutes < 5) {
      setExpirationError('Minimum expiration is 5 minutes')
      return
    }

    setExpirationError('')
    onSave({ isPublic, expirationMinutes: expirationMinutes || undefined })
  }

  const handleCancel = () => {
    if (isSaving) return
    setExpirationMinutes(null)
    setExpirationError('')
    onClose()
  }

  return (
    <>
      <dialog
        ref={saveModalRef}
        className="modal"
        style={{ zIndex: 1000 }}
      >
        <form method="dialog" className="modal-box rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">💾</span>
            </div>
            <div>
              <h3 className="font-bold text-2xl text-base-content">Save Your Code</h3>
              <p className="text-sm text-base-content/60">Share your discord.js snippets</p>
            </div>
          </div>

          <div className="space-y-5">
            <div className="divider my-0"></div>

            <div className="form-control">
              <label className="label cursor-pointer gap-3">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="checkbox checkbox-primary checkbox-sm"
                />
                <span className="label-text font-semibold text-base">Make this code public</span>
              </label>
              <p className="text-xs text-base-content/60 mt-2 pl-9">
                {isPublic
                  ? '🌐 Anyone can find and view this code via search'
                  : '🔒 Only shareable via direct link'}
              </p>
            </div>

            {/* Expiration Section */}
            <ExpirationInput
              value={expirationMinutes}
              onOpenModal={() => setShowExpirationModal(true)}
              error={expirationError}
            />

            {/* Expiration summary: show only when user set a custom expiration, otherwise show default 7 days */}
            <div className="pl-4">
              {/* Show human-friendly expiration date/time and duration (computed on client).
                  Pass `isOpen` so the timestamp can refresh more frequently when the modal is visible. */}
              <ExpirationTimestamp expirationMinutes={expirationMinutes} isOpen={isOpen} />
            </div>

            <div className="modal-action gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                className="btn btn-ghost rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="btn btn-primary rounded-xl gap-2"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    💾 Save & Share
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
        <form method="dialog" className="modal-backdrop">
          <button onClick={handleCancel} />
        </form>
      </dialog>

      {/* Separate Expiration Modal */}
      <ExpirationModal
        isOpen={showExpirationModal}
        onClose={() => setShowExpirationModal(false)}
        value={expirationMinutes}
        onChange={setExpirationMinutes}
      />
    </>
  )
}