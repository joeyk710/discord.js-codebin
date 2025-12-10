'use client'

import React, { useState, useMemo, useRef, useEffect, forwardRef } from 'react'
import { SUPPORTED_LANGUAGES } from '@/lib/languages'

interface LanguageSelectorModalProps {
    onClose: () => void
    onSelect: (language: string) => void
    currentLanguage: string
}


const getLanguageIcon = (language: string) => {
    // Use static icons downloaded into public/material-icons when available
    const iconMap: Record<string, React.ReactNode> = {
        'JavaScript': <img src="/material-icons/javascript.svg" alt="JavaScript" className="w-6 h-6" />,
        'TypeScript': <img src="/material-icons/typescript.svg" alt="TypeScript" className="w-6 h-6" />,
        'JSON': <img src="/material-icons/json.svg" alt="JSON" className="w-6 h-6" />,
        'Text': <span className="text-xl">📝</span>,
    }

    if (iconMap[language]) {
        return iconMap[language]
    }

    // Return emoji for other languages
    return <span className="text-xl">{'📄'}</span>
}

// Simple fuzzy search implementation
const fuzzySearch = (query: string, items: string[]): string[] => {
    if (!query.trim()) return items

    const lowerQuery = query.toLowerCase()
    const scored = items.map((item) => {
        let score = 0
        let queryIndex = 0
        let itemLower = item.toLowerCase()

        for (let i = 0; i < itemLower.length; i++) {
            if (queryIndex < lowerQuery.length && itemLower[i] === lowerQuery[queryIndex]) {
                score += 10
                queryIndex++
            } else {
                score -= 1
            }
        }

        // Boost score if query is at the start
        if (itemLower.startsWith(lowerQuery)) {
            score += 50
        }

        return { item, score, matches: queryIndex === lowerQuery.length }
    })

    return scored
        .filter((s) => s.matches)
        .sort((a, b) => b.score - a.score)
        .map((s) => s.item)
}

export default forwardRef<HTMLDialogElement, LanguageSelectorModalProps>(
    function LanguageSelectorModal({ onClose, onSelect, currentLanguage }, ref) {
        const [searchQuery, setSearchQuery] = useState('')
        const [selectedIndex, setSelectedIndex] = useState(0)
        const inputRef = useRef<HTMLInputElement>(null)
        const dialogRef = useRef<HTMLDialogElement | null>(null)

        const filteredLanguages = useMemo(
            () => fuzzySearch(searchQuery, SUPPORTED_LANGUAGES),
            [searchQuery]
        )



        // Clear search input whenever the dialog is closed so it's blank on next open
        useEffect(() => {
            const el = dialogRef.current ?? (ref && typeof ref === 'object' ? (ref as any).current : null)
            if (!el) return

            let timer: number | null = null
            const handleClose = () => {
                // Defer clearing slightly so it happens after the dialog close animation
                // and after any parent state updates that may occur on close.
                timer = window.setTimeout(() => {
                    setSearchQuery('')
                    setSelectedIndex(0)
                    timer = null
                }, 200)
            }

            el.addEventListener('close', handleClose)
            return () => {
                el.removeEventListener('close', handleClose)
                if (timer) {
                    clearTimeout(timer)
                }
            }
        }, [ref])

        const handleSelect = (language: string) => {
            onSelect(language)
            onClose()
        }

        const handleKeyDown = (e: React.KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setSelectedIndex((prev) => (prev + 1) % filteredLanguages.length)
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setSelectedIndex((prev) =>
                        prev === 0 ? filteredLanguages.length - 1 : prev - 1
                    )
                    break
                case 'Enter':
                    e.preventDefault()
                    if (filteredLanguages.length > 0) {
                        handleSelect(filteredLanguages[selectedIndex])
                    }
                    break
            }
        }

        return (
            <dialog
                ref={(el) => {
                    // Keep forwarded ref in sync (supports object refs and callback refs)
                    dialogRef.current = el
                    if (!ref) return
                    if (typeof ref === 'function') {
                        try { ref(el) } catch (e) { /* ignore */ }
                    } else {
                        try { (ref as any).current = el } catch (e) { /* ignore */ }
                    }
                }}
                className="modal"
                onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                        e.preventDefault()
                        onClose()
                    }
                }}
            >
                <div className="modal-box rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
                    <h3 className="font-bold text-lg mb-4">Select Language</h3>

                    {/* Search Input */}
                    <div className="mb-4">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search languages..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setSelectedIndex(0)
                            }}
                            onKeyDown={handleKeyDown}
                            className="input input-primary w-full input-sm rounded-lg"
                        />
                    </div>

                    {/* Language List */}
                    <div className="overflow-y-auto max-h-64 mb-4">
                        {filteredLanguages.length > 0 ? (
                            <ul className="space-y-2">
                                {filteredLanguages.map((language, index) => (
                                    <li key={language}>
                                        <button
                                            onClick={() => handleSelect(language)}
                                            className={`w-full text-left rounded-lg py-3 px-4 transition-colors flex items-center justify-between ${index === selectedIndex ? 'bg-primary text-primary-content' : 'hover:bg-base-200 hover:cursor-pointer'
                                                } ${currentLanguage === language
                                                    ? 'font-bold'
                                                    : ''
                                                }`}

                                        >
                                            <div className="flex items-center gap-3">
                                                {getLanguageIcon(language)}
                                                <span className="text-base">{language}</span>
                                            </div>
                                            {currentLanguage === language && (
                                                <span className="badge badge-primary text-xs">Current</span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8 text-base-content/50">
                                No languages found
                            </div>
                        )}
                    </div>

                    {/* Helper text */}
                    <div className="text-xs text-base-content/60 mb-4">
                        ↑↓ Navigate • Enter Select • Esc Close
                    </div>

                    {/* Modal Actions */}
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-ghost rounded-xl hover:cursor-pointer">Close</button>
                        </form>
                    </div>
                </div>

                {/* Backdrop */}
                <form method="dialog" className="modal-backdrop">
                    <button onClick={onClose} />
                </form>
            </dialog>
        )
    }
)
