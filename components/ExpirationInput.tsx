'use client'

import React from 'react'

interface ExpirationInputProps {
    value: number | null // Minutes
    onOpenModal: () => void
    error?: string
}

const PRESETS = [
    { label: '5 minutes', minutes: 5 },
    { label: '15 minutes', minutes: 15 },
    { label: '30 minutes', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '6 hours', minutes: 360 },
    { label: '1 day', minutes: 1440 },
    { label: '3 days', minutes: 4320 },
    { label: '7 days', minutes: 10080 },
]

export default function ExpirationInput({
    value,
    onOpenModal,
    error,
}: ExpirationInputProps) {
    const getDisplayLabel = (): string => {
        if (value === null) {
            return 'Set expiration...'
        }

        const preset = PRESETS.find(p => p.minutes === value)
        if (preset) {
            return preset.label
        }

        if (value < 60) {
            return `${value} minute${value !== 1 ? 's' : ''}`
        } else if (value < 1440) {
            const hours = Math.round((value / 60) * 10) / 10
            return `${hours} hour${hours !== 1 ? 's' : ''}`
        } else {
            const days = Math.round((value / 1440) * 10) / 10
            return `${days} day${days !== 1 ? 's' : ''}`
        }
    }

    const isError = error !== undefined && error !== ''

    return (
        <div className="form-control w-full">
            <label className="label pb-2">
                <span className="label-text font-semibold text-base">Expiration</span>
                <span className="text-xs text-base-content/60">(minimum 5 minutes, max 7 days)</span>
            </label>

            <button
                type="button"
                onClick={onOpenModal}
                className={`btn btn-sm w-full justify-start rounded-lg border-2 transition-colors hover:cursor-pointer ${isError
                    ? 'btn-error border-error text-error-content'
                    : value === null
                        ? 'btn-ghost border-black/50 text-base-content/60 expiration-border'
                        : 'btn-ghost border-black/50 border-success text-success expiration-border'
                    }`}
            >
                <span className={value === null ? '' : '✓'}>
                    {getDisplayLabel()}
                </span>
            </button>

            {/* Error Display */}
            {isError && (
                <p className="text-xs text-error mt-2">
                    {error || '⚠️ Minimum expiration is 5 minutes'}
                </p>
            )}

            {/* Info Display intentionally handled in SaveModal (client-only timestamp) */}
        </div>
    )
}
