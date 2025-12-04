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
    const [inputMode, setInputMode] = useState<'search' | 'custom'>('search')
    const modalRef = useRef<HTMLDialogElement>(null)
    const [selectedMinutes, setSelectedMinutes] = useState<number | null>(value ?? null)

    // Sync modal state
    useEffect(() => {
        if (modalRef.current) {
            if (isOpen) {
                modalRef.current.showModal()
            } else {
                modalRef.current.close()
            }
        }
    }, [isOpen])

    // Detect input mode and filter presets
    useEffect(() => {
        if (!searchInput.trim()) {
            setFilteredPresets(PRESETS)
            setInputMode('search')
            return
        }

        // Try parsing as duration first
        const parsed = parseDuration(searchInput)
        if (parsed !== null) {
            setInputMode('custom')
            setFilteredPresets([])
            return
        }

        // Fall back to preset search
        setInputMode('search')
        const query = searchInput.toLowerCase()
        const filtered = PRESETS.filter(preset => {
            const label = preset.label.toLowerCase()
            let queryIdx = 0
            for (let i = 0; i < label.length && queryIdx < query.length; i++) {
                if (label[i] === query[queryIdx]) {
                    queryIdx++
                }
            }
            return queryIdx === query.length
        })
        setFilteredPresets(filtered)
    }, [searchInput])

    // When modal opens, initialize the selectedMinutes to the current value
    useEffect(() => {
        if (isOpen) {
            setSelectedMinutes(value ?? null)
        }
    }, [isOpen, value])

    const handleSelectPreset = (preset: ExpirationPreset) => {
        // Selecting a preset should mark it as selected but NOT close the modal.
        setSelectedMinutes(preset.minutes)
        setSearchInput('')
    }

    const parseDuration = (input: string): number | null => {
        if (!input) return null

        const s = input.trim()
        if (!s) return null

        // Match groups like '1.5h', '90m', '2d', or plain numbers '90'
        const regex = /(\d+(?:\.\d+)?)(?:\s*(d|day|days|h|hr|hrs|hour|hours|m|min|mins|minute|minutes))?/gi
        let match: RegExpExecArray | null
        let total = 0
        let found = false

        while ((match = regex.exec(s)) !== null) {
            found = true
            const num = parseFloat(match[1])
            const unit = match[2] ? match[2].toLowerCase() : undefined

            if (!unit) {
                // No unit -> minutes
                total += Math.round(num)
            } else if (unit.startsWith('d')) {
                total += Math.round(num * 1440)
            } else if (unit.startsWith('h')) {
                total += Math.round(num * 60)
            } else {
                // minutes
                total += Math.round(num)
            }
        }

        if (!found) return null
        return total
    }

    const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value)
    }

    const handleApplyCustom = () => {
        const parsed = parseDuration(searchInput)
        if (parsed !== null && parsed >= 5 && parsed <= 10080) {
            // Apply custom selection locally; do not close the modal. Done will persist.
            setSelectedMinutes(parsed)
            setSearchInput('')
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

    const getDisplayLabelFor = (minutes: number): string => {
        if (minutes < 60) {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`
        } else if (minutes < 1440) {
            const hours = Math.round((minutes / 60) * 10) / 10
            return `${hours} hour${hours !== 1 ? 's' : ''}`
        } else {
            const days = Math.round((minutes / 1440) * 10) / 10
            return `${days} day${days !== 1 ? 's' : ''}`
        }
    }

    const parsedMinutes = parseDuration(searchInput)
    const isError = parsedMinutes !== null && parsedMinutes < 5

    const handleClose = () => {
        // Close modal and clear the search input, but do not modify the current expiration value.
        // Resetting the expiration is handled explicitly by the Reset button (handleReset).
        onClose()
        setSearchInput('')
    }

    const handleReset = () => {
        setSelectedMinutes(null)
        onChange(null)
        setSearchInput('')
        onClose()
    }

    const parsedCustom = inputMode === 'custom' ? parseDuration(searchInput) : null
    const customIsValid = parsedCustom !== null && parsedCustom >= 5 && parsedCustom <= 10080

    const handleDialogClick = (e: React.MouseEvent<HTMLDialogElement>) => {
        // Close if clicking on the backdrop (outside the modal-box)
        if (e.target === modalRef.current) {
            onClose()
        }
    }

    const dialogContent = (
        <dialog
            ref={modalRef}
            className="modal"
            onClick={handleDialogClick}
        >
            <form method="dialog" className="modal-box w-full sm:max-w-md">
                <h3 className="font-bold text-lg mb-4">Select Expiration Time</h3>

                {/* Search Input */}
                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Search presets or enter custom — e.g. 90, 1.5h, 2 days"
                        value={searchInput}
                        onChange={handleSearchInput}
                        className="input input-sm w-full rounded-lg text-sm input-bordered"
                    />
                </div>

                {/* Presets List (shown when searching presets or empty) */}
                {inputMode === 'search' && (
                    <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                        {filteredPresets.length > 0 ? (
                            filteredPresets.map((preset) => (
                                <button
                                    key={preset.minutes}
                                    type="button"
                                    onClick={() => handleSelectPreset(preset)}
                                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm hover:cursor-pointer ${((selectedMinutes ?? value) === preset.minutes)
                                        ? 'bg-primary text-primary-content'
                                        : 'hover:bg-base-200'
                                        }`}
                                >
                                    {preset.label}
                                </button>
                            ))
                        ) : (
                            <div className="px-3 py-2 text-sm text-base-content/50">
                                No presets match
                            </div>
                        )}
                    </div>
                )}

                {/* Custom Duration Input (shown when user enters a custom duration) */}
                {inputMode === 'custom' && (
                    <div className="space-y-2 mb-4">
                        {customIsValid && (
                            <>
                                <p className="text-xs text-success font-semibold">
                                    ✓ Parsed: {getDisplayLabelFor(parsedCustom!)}
                                </p>
                                <button
                                    type="button"
                                    onClick={handleApplyCustom}
                                    className="w-full btn btn-sm btn-primary rounded-lg"
                                >
                                    Apply {getDisplayLabelFor(parsedCustom!)}
                                </button>
                            </>
                        )}
                        {parsedCustom !== null && parsedCustom < 5 && (
                            <p className="text-xs text-error font-semibold">
                                ⚠️ Minimum is 5 minutes (you entered {parsedCustom} {parsedCustom === 1 ? 'minute' : 'minutes'})
                            </p>
                        )}
                        {parsedCustom !== null && parsedCustom > 10080 && (
                            <p className="text-xs text-error font-semibold">
                                ⚠️ Maximum is 7 days (you entered {getDisplayLabelFor(parsedCustom)})
                            </p>
                        )}
                        {parsedCustom === null && (
                            <p className="text-xs text-error font-semibold">
                                ⚠️ Could not parse. Try formats: 90, 1.5h, 2 days, etc.
                            </p>
                        )}
                    </div>
                )}

                {/* Modal Actions */}
                <div className="modal-action gap-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="btn btn-sm btn-ghost rounded-xl"
                    >
                        Cancel
                    </button>
                    {(selectedMinutes !== null || value !== null) && (
                        <button
                            type="button"
                            onClick={handleReset}
                            className="btn btn-sm btn-outline rounded-xl"
                        >
                            ✕ Reset
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            // Persist the selectedMinutes if user chose one, otherwise keep existing value.
                            if (selectedMinutes !== null) {
                                onChange(selectedMinutes)
                            }
                            onClose()
                            setSearchInput('')
                        }}
                        className="btn btn-sm btn-primary rounded-xl"
                    >
                        Done
                    </button>
                </div>
            </form>
        </dialog>
    )

    return dialogContent
}
