'use client'

import React from 'react'
import Toast, { ToastProps } from './Toast'

interface ToastContainerProps {
    toasts: ToastProps[]
    onClose: (id: string) => void
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
    return (
        <div className="toast toast-top toast-end z-[9999]">
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} onClose={onClose} />
            ))}
        </div>
    )
}
