'use client'

import React, { useState, useRef, useEffect } from 'react'

interface SaveModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (metadata: { title: string; description: string; language: string; isPublic: boolean }) => void
  isSaving: boolean
  language: 'javascript' | 'typescript' | 'json'
}

export default function SaveModal({ isOpen, onClose, onSave, isSaving, language }: SaveModalProps) {
  const [title, setTitle] = useState('Untitled')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const saveModalRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (saveModalRef.current) {
      saveModalRef.current.checked = isOpen
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ title, description, language, isPublic })
    onClose()
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
        <div className="modal-box w-full sm:max-w-md">
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

            <div className="modal-action gap-3">
              <button
                type="button"
                onClick={() => {
                  onClose()
                  if (saveModalRef.current) {
                    saveModalRef.current.checked = false
                  }
                }}
                className="btn btn-ghost rounded-xl"
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
          onClick={onClose}
        ></label>
      </div>
    </>
  )
}

