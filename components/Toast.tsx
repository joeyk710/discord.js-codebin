"use client"

import React, { useEffect, useState, useRef } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

export interface ToastProps {
    id: string
    message: React.ReactNode
    type?: 'success' | 'error' | 'info' | 'warning'
    duration?: number
    onClose: (id: string) => void
}

export default function Toast({ id, message, type = 'info', duration = 3000, onClose }: ToastProps) {
    const [isClosing, setIsClosing] = useState(false)
    const closeTimerRef = useRef<number | null>(null)
    const removeTimerRef = useRef<number | null>(null)

    const FADE_MS = 250

    useEffect(() => {
        if (duration > 0) {
            const startFadeAt = Math.max(0, duration - FADE_MS)
            closeTimerRef.current = window.setTimeout(() => {
                setIsClosing(true)
                removeTimerRef.current = window.setTimeout(() => onClose(id), FADE_MS)
            }, startFadeAt)

            return () => {
                if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
                if (removeTimerRef.current) clearTimeout(removeTimerRef.current)
            }
        }
    }, [id, duration, onClose])

    const getIcon = () => {
        // Use `text-current` so the icon inherits the alert's content color
        // (daisyUI sets a suitable content color like `success-content`).
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="w-5 h-5 text-current" />
            case 'error':
                return <ExclamationCircleIcon className="w-5 h-5 text-current" />
            case 'warning':
                return <ExclamationCircleIcon className="w-5 h-5 text-current" />
            default:
                return <InformationCircleIcon className="w-5 h-5 text-current" />
        }
    }

    const getAlertClass = () => {
        switch (type) {
            case 'success':
                return 'alert-success'
            case 'error':
                return 'alert-error'
            case 'warning':
                return 'alert-warning'
            default:
                return 'alert-info'
        }
    }

    return (
        <div
            className={`alert ${getAlertClass()} shadow-lg rounded-xl p-4 w-full max-w-xl transition-opacity duration-200 ease-out`}
            style={{ opacity: isClosing ? 0 : 1 }}
        >
            <div className="flex items-center w-full justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">{getIcon()}</div>
                    <div className="text-base text-left">{message}</div>
                </div>
            </div>
        </div>
    )
}
