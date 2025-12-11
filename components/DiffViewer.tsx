'use client'

import React, { useState, useEffect } from 'react'
import { DiffResult } from '@/lib/diffUtils'

interface DiffViewerProps {
    oldContent: string | null | undefined
    newContent: string
    filePath?: string
    isCollapsed?: boolean
}

export default function DiffViewer({
    oldContent,
    newContent,
    filePath = 'file',
    isCollapsed = false,
}: DiffViewerProps) {
    const [expanded, setExpanded] = useState(!isCollapsed)
    const [diff, setDiff] = useState<DiffResult | null>(null)

    useEffect(() => {
        // Generate diff client-side using the diffUtils
        const generateClientDiff = async () => {
            try {
                const { generateDiff } = await import('@/lib/diffUtils')
                const result = generateDiff(oldContent, newContent)
                setDiff(result)
            } catch (err) {
                console.error('Error generating diff:', err)
            }
        }

        generateClientDiff()
    }, [oldContent, newContent])

    if (!diff) {
        return (
            <div className="flex justify-center py-8">
                <div className="loading loading-spinner loading-sm"></div>
            </div>
        )
    }

    const hasDiff = diff.addedCount > 0 || diff.removedCount > 0

    return (
        <div className="bg-base-100 rounded-lg border border-base-300 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-base-200 border-b border-base-300 flex items-center justify-between">
                <button
                    onClick={() => setExpanded(!expanded)}
                    className="flex items-center gap-3 flex-1 hover:opacity-75"
                >
                    <svg
                        className={`w-5 h-5 transition-transform ${expanded ? 'rotate-90' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <div className="text-left">
                        <h3 className="font-semibold text-base-content">{filePath}</h3>
                        {!expanded && hasDiff && (
                            <p className="text-xs text-base-content/60">
                                {diff.addedCount > 0 && <span className="text-success">+{diff.addedCount}</span>}{' '}
                                {diff.removedCount > 0 && <span className="text-error">-{diff.removedCount}</span>}
                            </p>
                        )}
                    </div>
                </button>

                {/* Summary badges */}
                {expanded && (
                    <div className="flex gap-2">
                        {diff.addedCount > 0 && (
                            <span className="badge badge-success badge-sm gap-1">
                                <span>+</span>
                                {diff.addedCount}
                            </span>
                        )}
                        {diff.removedCount > 0 && (
                            <span className="badge badge-error badge-sm gap-1">
                                <span>-</span>
                                {diff.removedCount}
                            </span>
                        )}
                        {!hasDiff && (
                            <span className="badge badge-ghost badge-sm">No changes</span>
                        )}
                    </div>
                )}
            </div>

            {/* Diff Content */}
            {expanded && (
                <div className="overflow-x-auto bg-base-900">
                    <div className="p-4 text-xs font-mono">
                        {diff.lines.map((line, idx) => (
                            <div
                                key={idx}
                                className={`py-1 transition-colors flex gap-2 ${line.type === 'add'
                                        ? 'bg-success/25 text-success border-l-4 border-success pl-2'
                                        : line.type === 'remove'
                                            ? 'bg-error/25 text-error border-l-4 border-error pl-2'
                                            : 'hover:bg-base-300/20'
                                    }`}
                            >
                                {/* Line number */}
                                <span className="inline-block w-10 text-right pr-2 opacity-50 select-none flex-shrink-0">
                                    {idx + 1}
                                </span>
                                {/* Change indicator */}
                                <span className="inline-block w-6 text-center opacity-60 select-none font-semibold flex-shrink-0">
                                    {line.type === 'add'
                                        ? '+'
                                        : line.type === 'remove'
                                            ? '−'
                                            : ' '}
                                </span>
                                {/* Content */}
                                <span className="leading-relaxed whitespace-pre-wrap break-words">{line.content}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
