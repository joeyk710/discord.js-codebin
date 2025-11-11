'use client'

import React, { useState, useRef, useEffect } from 'react'

interface ExpirationPreset {
    label: string
    minutes: number
}

const PRESETS: ExpirationPreset[] = [
    { label: '5 minutes', minutes: 5 },
    { label: '15 minutes', minutes: 15 },
    { label: '30 minutes', minutes: 30 },
    { label: '1 hour', minutes: 60 },
    { label: '6 hours', minutes: 360 },
    { label: '1 day', minutes: 1440 },
    { label: '3 days', minutes: 4320 },
    { label: '7 days', minutes: 10080 },
]

interface ExpirationModalProps {
    isOpen: boolean
    onClose: () => void
    value: number | null
    onChange: (minutes: number | null) => void
}

export default function ExpirationModal({
    isOpen,
    onClose,
    value,
    onChange,
}: ExpirationModalProps) {
    const [searchInput, setSearchInput] = useState('')
    const [filteredPresets, setFilteredPresets] = useState<ExpirationPreset[]>(PRESETS)
    const [customMinutes, setCustomMinutes] = useState<number | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const modalRef = useRef<HTMLInputElement>(null)

    // Sync modal state
    useEffect(() => {
        if (modalRef.current) {
            modalRef.current.checked = isOpen
        }
    }, [isOpen])

    // Fuzzy search filter
    useEffect(() => {
        if (!searchInput.trim()) {
            setFilteredPresets(PRESETS)
            return
        }

        const query = searchInput.toLowerCase()
        const filtered = PRESETS.filter(preset => {
            let queryIdx = 0
            for (let i = 0; i < preset.label.length && queryIdx < query.length; i++) {
                if (preset.label[i] === query[queryIdx]) {
                    queryIdx++
                }
            }
            return queryIdx === query.length
        }).sort((a, b) => {
            const aIdx = a.label.toLowerCase().indexOf(query[0])
            const bIdx = b.label.toLowerCase().indexOf(query[0])
            return aIdx - bIdx
        })

        setFilteredPresets(filtered)
    }, [searchInput])

    const handleSelectPreset = (preset: ExpirationPreset) => {
        onChange(preset.minutes)
        onClose()
        setSearchInput('')
        setCustomMinutes(null)
    }

    const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        if (!val) {
            setCustomMinutes(null)
            onChange(null)
            return
        }

        const minutes = parseInt(val, 10)
        if (!isNaN(minutes)) {
            if (minutes < 5) {
                setCustomMinutes(minutes)
                onChange(null)
            } else {
                setCustomMinutes(minutes)
                onChange(minutes)
            }
        }
    }

    const getDisplayLabel = (): string => {
        if (value === null) {
            return 'Not set'
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

    const isError = customMinutes !== null && customMinutes < 5

    const handleClose = () => {
        onClose()
        setSearchInput('')
        setCustomMinutes(null)
    }

    const handleReset = () => {
        onChange(null)
        setSearchInput('')
        setCustomMinutes(null)
        onClose()
    }

    return (
        <>
            <input
                ref={modalRef}
                type="checkbox"
                id="expiration_modal"
                className="modal-toggle"
            />
            <div className="modal">
                <div className="modal-box w-full sm:max-w-md">
                    <h3 className="font-bold text-lg mb-4">Select Expiration Time</h3>
                    <p className="text-sm text-base-content/70 mb-4">
                        Minimum expiration is 5 minutes
                    </p>

                    {/* Search Input */}
                    <div className="mb-4">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search or enter minutes..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="input input-bordered w-full rounded-lg text-sm"
                            autoFocus
                        />
                    </div>

                    {/* Presets List */}
                    <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                        {filteredPresets.length > 0 ? (
                            filteredPresets.map((preset) => (
                                <button
                                    key={preset.minutes}
                                    type="button"
                                    onClick={() => handleSelectPreset(preset)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${value === preset.minutes ? 'bg-primary text-primary-content' : 'hover:bg-base-200'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-base-content/50">
                                No presets match your search
                            </div>
                        )}
                    </div>

                    <div className="divider my-3">or</div>

                    {/* Custom Input */}
                    <div className="space-y-3 mb-6">
                        <div className="flex gap-2">
                            <input
                                type="number"
                                placeholder="Enter minutes"
                                value={customMinutes ?? ''}
                                onChange={handleCustomInput}
                                min="5"
                                className={`input input-sm flex-1 rounded-lg text-sm ${customMinutes !== null && customMinutes < 5
                                    ? 'input-error border-error'
                                    : 'input-bordered'
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (customMinutes !== null && customMinutes >= 5) {
                                        handleSelectPreset({
                                            label: `${customMinutes} minutes`,
                                            minutes: customMinutes,
                                        })
                                    }
                                }}
                                disabled={customMinutes === null || customMinutes < 5}
                                className="btn btn-sm btn-primary rounded-lg"
                            >
                                Set
                            </button>
                        </div>
                        {customMinutes !== null && customMinutes < 5 && (
                            <p className="text-xs text-error">
                                ⚠️ Minimum is 5 minutes
                            </p>
                        )}
                    </div>

                    {/* Modal Actions */}
                    <div className="modal-action gap-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="btn btn-sm btn-ghost rounded-lg"
                        >
                            Cancel
                        </button>
                        {value !== null && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="btn btn-sm btn-outline rounded-lg"
                            >
                                ✕ Reset
                            </button>
                        )}
                        {value !== null && (
                            <button
                                type="button"
                                onClick={handleClose}
                                className="btn btn-sm btn-primary rounded-lg"
                            >
                                Done
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    )
}
