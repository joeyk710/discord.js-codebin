'use client'

import React, { useEffect } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

export interface ToastProps {
    id: string
    message: string
    type?: 'success' | 'error' | 'info' | 'warning'
    duration?: number
    onClose: (id: string) => void
}

export default function Toast({ id, message, type = 'info', duration = 3000, onClose }: ToastProps) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                onClose(id)
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [id, duration, onClose])

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircleIcon className="w-5 h-5 text-success" />
            case 'error':
                return <ExclamationCircleIcon className="w-5 h-5 text-error" />
            case 'warning':
                return <ExclamationCircleIcon className="w-5 h-5 text-warning" />
            default:
                return <InformationCircleIcon className="w-5 h-5 text-info" />
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
        <div className={`alert ${getAlertClass()} shadow-lg rounded-xl flex items-center gap-3 min-w-[280px] max-w-md`}>
            {getIcon()}
            <span className="flex-1 text-sm">{message}</span>
            <button
                onClick={() => onClose(id)}
                className="btn btn-ghost btn-xs btn-circle"
                aria-label="Close"
            >
                <XMarkIcon className="w-4 h-4" />
            </button>
        </div>
    )
}
