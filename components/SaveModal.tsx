'use client'

import React, { useRef, useEffect } from 'react'
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
  const saveModalRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (saveModalRef.current) {
      saveModalRef.current.checked = isOpen
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

  return (
    <>
      <input
        ref={saveModalRef}
        type="checkbox"
        id="save_modal"
        className="modal-toggle"
      />
      <div className="modal">
        <div className="modal-box w-full sm:max-w-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">💾</span>
            <div>
              <h3 className="font-bold text-2xl text-base-content">Save Your Code</h3>
              <p className="text-sm text-base-content/60">Share your discord.js snippets</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <div className="modal-action gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  if (saveModalRef.current) {
                    saveModalRef.current.checked = false
                  }
                }}
                disabled={isSaving}
                className="btn btn-ghost rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
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
          </form>
        </div>
        <label
          className="modal-backdrop"
          htmlFor="save_modal"
          onClick={() => !isSaving && onClose()}
        ></label>
      </div>

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