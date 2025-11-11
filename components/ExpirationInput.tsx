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

interface ExpirationInputProps {
    value: number | null // Minutes
    onChange: (minutes: number | null) => void
    error?: string
}

export default function ExpirationInput({
    value,
    onChange,
    error,
}: ExpirationInputProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchInput, setSearchInput] = useState('')
    const [filteredPresets, setFilteredPresets] = useState<ExpirationPreset[]>(PRESETS)
    const [customMinutes, setCustomMinutes] = useState<number | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Fuzzy search filter
    useEffect(() => {
        if (!searchInput.trim()) {
            setFilteredPresets(PRESETS)
            return
        }

        const query = searchInput.toLowerCase()
        const filtered = PRESETS.filter(preset => {
            // Fuzzy match on label
            let queryIdx = 0
            for (let i = 0; i < preset.label.length && queryIdx < query.length; i++) {
                if (preset.label[i] === query[queryIdx]) {
                    queryIdx++
                }
            }
            return queryIdx === query.length
        }).sort((a, b) => {
            // Sort by how early the match occurs
            const aIdx = a.label.toLowerCase().indexOf(query[0])
            const bIdx = b.label.toLowerCase().indexOf(query[0])
            return aIdx - bIdx
        })

        setFilteredPresets(filtered)
    }, [searchInput])

    // Handle clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelectPreset = (preset: ExpirationPreset) => {
        onChange(preset.minutes)
        setIsOpen(false)
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
                // Invalid - less than 5 minutes
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
            return 'Set expiration...'
        }

        // Find matching preset
        const preset = PRESETS.find(p => p.minutes === value)
        if (preset) {
            return preset.label
        }

        // Custom value
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

    const isError = error || (customMinutes !== null && customMinutes < 5)

    return (
        <div className="form-control w-full" ref={dropdownRef}>
            <label className="label pb-2">
                <span className="label-text font-semibold text-base">Expiration</span>
                <span className="text-xs text-base-content/60">(minimum 5 minutes)</span>
            </label>

            <div className="relative">
                {/* Display Button */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className={`btn btn-sm w-full justify-start rounded-lg border-2 transition-colors ${isError
                            ? 'btn-error border-error text-error-content'
                            : value === null
                                ? 'btn-ghost border-base-300 text-base-content/60'
                                : 'btn-ghost border-success text-success'
                        }`}
                >
                    <span className={value === null ? '' : '✓'}>
                        {getDisplayLabel()}
                    </span>
                </button>

                {/* Dropdown */}
                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border-2 border-base-300 rounded-lg shadow-lg z-50">
                        {/* Search Input */}
                        <div className="p-2 border-b border-base-300">
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search or enter minutes..."
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                className="input input-sm input-bordered w-full rounded-md text-sm"
                                autoFocus
                            />
                        </div>

                        {/* Presets List */}
                        <div className="max-h-48 overflow-y-auto">
                            {filteredPresets.length > 0 ? (
                                filteredPresets.map((preset) => (
                                    <button
                                        key={preset.minutes}
                                        type="button"
                                        onClick={() => handleSelectPreset(preset)}
                                        className={`w-full text-left px-3 py-1.5 hover:bg-base-200 transition-colors text-sm ${value === preset.minutes ? 'bg-primary text-primary-content' : ''
                                            }`}
                                    >
                                        {preset.label}
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-2 text-xs text-base-content/50">
                                    No presets match your search
                                </div>
                            )}
                        </div>

                        {/* Or Divider */}
                        <div className="divider my-1 px-3">or</div>

                        {/* Custom Input */}
                        <div className="p-2 border-t border-base-300">
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Enter minutes"
                                    value={customMinutes ?? ''}
                                    onChange={handleCustomInput}
                                    min="5"
                                    className={`input input-sm flex-1 rounded-md text-sm ${customMinutes !== null && customMinutes < 5
                                            ? 'input-error border-error'
                                            : ''
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
                                    className="btn btn-sm btn-primary rounded-md"
                                >
                                    Set
                                </button>
                            </div>
                            {customMinutes !== null && customMinutes < 5 && (
                                <p className="text-xs text-error mt-1.5">
                                    ⚠️ Minimum is 5 minutes
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Error Display */}
            {isError && (
                <p className="text-xs text-error mt-2">
                    {error || '⚠️ Minimum expiration is 5 minutes'}
                </p>
            )}

            {/* Info Display */}
            {value !== null && !isError && (
                <p className="text-xs text-success mt-2">
                    ✓ Expires in {getDisplayLabel()}
                </p>
            )}
        </div>
    )
}
