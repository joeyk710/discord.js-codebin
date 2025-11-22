"use client"

import React from 'react'
import { createPortal } from 'react-dom'

interface ErrorModalProps {
    open: boolean
    title?: string
    message?: React.ReactNode
    onClose: () => void
}

export default function ErrorModal({ open, title = 'Error', message, onClose }: ErrorModalProps) {
    if (!open) return null

    // Portal the modal to document.body so it escapes layout containers
    // and behaves like other modals in the app.
    // Uses daisyUI modal markup to maintain visual consistency.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return createPortal(
        <>
            <div className="modal">
                <div className="modal-box rounded-2xl max-w-md">
                    <h3 className="font-bold text-lg text-error">❌ {title}</h3>
                    <p className="py-4 text-base-content/70">{message}</p>
                    <div className="modal-action">
                        <button className="btn btn-primary rounded-xl" onClick={onClose}>OK</button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button>close</button>
                </form>
            </div>
        </>,
        document.body
    )
}
