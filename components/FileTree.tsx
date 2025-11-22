'use client'

import React, { useState, useCallback, useId, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import { FileNode, getLanguageIcon, getMaterialIconFilename } from '@/lib/fileTree'
import { inferLanguageFromFilename } from '@/lib/fileTree'

const MATERIAL_ICON_LANGS = new Set([
    'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'objective-c', 'groovy', 'clojure', 'haskell', 'elixir', 'erlang', 'ocaml', 'scheme', 'lisp', 'lua', 'perl', 'powershell', 'pascal', 'cobol', 'fortran', 'ada', 'prolog', 'dart', 'solidity', 'webassembly', 'html', 'css', 'sass', 'less', 'json', 'xml', 'yaml', 'toml', 'markdown', 'graphql', 'docker', 'makefile'
])

interface FileTreeProps {
    files: FileNode[]
    activeFile?: string
    onFileSelect: (path: string) => void
    onAddFile?: (folderPath: string) => void
    onDeleteFile?: (path: string) => void
    onRenameFile?: (oldPath: string, newPath: string) => void
    isReadOnly?: boolean
    openFiles?: string[]
}

function FileTreeNode({
    node,
    level,
    activeFile,
    onFileSelect,
    onAddFile,
    onDeleteFile,
    onRenameFile,
    onRequestRename,
    isReadOnly,
    openFiles,
    filesCount,
    isExpanded,
    onToggleExpand,
    isFolderExpanded,
}: {
    node: FileNode
    level: number
    activeFile?: string
    onFileSelect: (path: string) => void
    onAddFile?: (folderPath: string) => void
    onDeleteFile?: (path: string) => void
    onRenameFile?: (oldPath: string, newPath: string) => void
    onRequestRename?: (path: string, name: string) => void
    isReadOnly?: boolean
    openFiles?: string[]
    filesCount?: number
    isExpanded?: boolean
    onToggleExpand?: (path: string) => void
    isFolderExpanded?: (path: string) => boolean
}) {
    const isFile = node.type === 'file'
    const isActive = activeFile === node.path
    const isOpen = !!openFiles?.includes(node.path)
    const contentRef = useRef<HTMLDivElement | null>(null)

    // Inline rename removed — FileTree manages a modal-based rename flow via onRequestRename

    return (
        <div key={node.path}>
            <div
                className={`
                    flex items-center min-w-0 gap-2 px-3 py-2 rounded-lg border border-base-400 dark:border-white/5 transition-colors relative focus:outline-none focus:ring-0 overflow-visible
                    ${isFile ? 'cursor-pointer hover:bg-base-300/60' : 'hover:bg-base-200/40'}
                    ${isActive && isFile ? 'bg-base-200/50 text-base-content/80 border-l-2 border-base-400' : ''}
                `}
                style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
                onClick={() => isFile && onFileSelect(node.path)}
            >
                {!isFile && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            onToggleExpand?.(node.path)
                        }}
                        className="p-0 w-6 h-6 flex items-center justify-center hover:bg-base-300 rounded"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                        aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
                    >
                        <svg
                            className="w-6 h-6 transform transition-transform duration-150"
                            style={{ transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                    </button>
                )}
                {isFile && (
                    <div className="mr-2 flex items-center">
                        {(() => {
                            const explicit = node.language ? node.language.toLowerCase() : null
                            const inferred = inferLanguageFromFilename(node.name)
                            const lang = explicit || inferred || 'javascript'
                            const mapped = lang === 'c++' || lang === 'cpp' ? 'cpp' : lang === 'c#' || lang === 'csharp' ? 'csharp' : lang === 'objectivec' ? 'objective-c' : lang === 'dockerfile' ? 'docker' : lang
                            if (MATERIAL_ICON_LANGS.has(mapped)) {
                                return (
                                    <img src={`/material-icons/${mapped}.svg`} alt={lang} className="w-4 h-4 inline-flex items-center justify-center object-contain tooltip tooltip-bottom" data-tip={lang} />
                                )
                            }
                            return (
                                <span className="w-4 h-4 inline-flex items-center justify-center tooltip tooltip-bottom" data-tip={lang}>{getLanguageIcon(lang)}</span>
                            )
                        })()}
                    </div>
                )}

                <span className="flex-1 text-left text-sm truncate">
                    {node.name}
                </span>

                {!isReadOnly && isFile && (
                    <div className="flex items-center gap-1 overflow-visible">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onRequestRename?.(node.path, node.name)
                            }}
                            className="btn btn-ghost btn-xs rounded-xl border border-base-400 dark:border-white/5 hover:border-base-500 z-50"
                            title="Rename"
                            aria-label="Rename file"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                // Prevent delete when there's only one file
                                if (filesCount && filesCount <= 1) return
                                onDeleteFile?.(node.path)
                            }}
                            className={`btn btn-ghost btn-xs rounded-xl border border-base-400 dark:border-white/5 group transition-colors hover:bg-error/10 hover:border-error hover:text-error z-50 ${filesCount && filesCount <= 1 ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
                            title="Delete"
                            aria-label="Delete file"
                            disabled={!!(filesCount && filesCount <= 1)}
                        >
                            <TrashIcon className="w-4 h-4 transition-colors" />
                        </button>
                    </div>
                )}
            </div>

            {!isFile && node.children && (
                // Animate children height/opacity when folder opens or closes. Keep overflow visible for tooltips.
                <div className="overflow-visible">
                    <div
                        className="overflow-hidden"
                        ref={contentRef}
                        style={{
                            maxHeight: isExpanded ? undefined : '0px',
                            opacity: isExpanded ? 1 : 0,
                            transform: isExpanded ? 'translateY(0)' : 'translateY(-4px)',
                            transition: 'max-height 200ms ease, opacity 180ms ease, transform 180ms ease'
                        }}
                    >
                        <div className="space-y-1 pt-1">
                            {node.children.map(child => (
                                <FileTreeNode
                                    key={child.path}
                                    node={child}
                                    level={level + 1}
                                    activeFile={activeFile}
                                    onFileSelect={onFileSelect}
                                    onAddFile={onAddFile}
                                    onDeleteFile={onDeleteFile}
                                    onRenameFile={onRenameFile}
                                    onRequestRename={onRequestRename}
                                    isReadOnly={isReadOnly}
                                    openFiles={openFiles}
                                    filesCount={filesCount}
                                    isExpanded={isFolderExpanded ? isFolderExpanded(child.path) : undefined}
                                    onToggleExpand={onToggleExpand}
                                    isFolderExpanded={isFolderExpanded}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default function FileTree({
    files,
    activeFile,
    onFileSelect,
    onAddFile,
    onDeleteFile,
    onRenameFile,
    isReadOnly = false,
    openFiles = [],
}: FileTreeProps) {
    const listRef = useRef<HTMLDivElement | null>(null)
    const [isOverflowing, setIsOverflowing] = useState(false)
    const containerRef = useRef<HTMLDivElement | null>(null)
    const headerRef = useRef<HTMLDivElement | null>(null)
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(() => {
        // Start with only root-level folders expanded by default
        const roots = files
            .filter(n => n.type === 'folder' && n.path.split('/').length === 1)
            .map(n => n.path)
        return new Set(roots)
    })

    const toggleFolder = useCallback((path: string) => {
        setExpandedFolders(prev => {
            const next = new Set(prev)
            if (next.has(path)) next.delete(path)
            else next.add(path)
            return next
        })
    }, [])

    const isFolderExpanded = useCallback((path: string) => expandedFolders.has(path), [expandedFolders])
    // Manage rename modal state at the tree level (replace inline editing)
    const [renameTarget, setRenameTarget] = useState<{ path: string; name: string } | null>(null)
    const [renameValue, setRenameValue] = useState('')
    const [errorMessage, setErrorMessage] = useState('')
    const [showErrorModal, setShowErrorModal] = useState(false)
    const [mounted, setMounted] = useState(false)
    // stable modal id for the portal-rendered modal
    const modalId = `rename_modal_${useId()}`

    useEffect(() => {
        setMounted(true)
    }, [])

    // Detect whether the file list content overflows its container and toggle scrolling.
    // Compute desired height based on expanded folders and node count, and clamp to available container height.
    useEffect(() => {
        const ROW_HEIGHT = 44 // estimated per-row height in px
        const el = listRef.current
        const container = containerRef.current
        const header = headerRef.current
        if (!el || !container) return

        const countVisibleNodes = (nodes: FileNode[]): number => {
            let count = 0
            for (const n of nodes) {
                count += 1
                if (n.type === 'folder' && n.children && expandedFolders.has(n.path)) {
                    count += countVisibleNodes(n.children)
                }
            }
            return count
        }

        const visibleCount = countVisibleNodes(files)
        const headerHeight = header ? header.clientHeight : 72
        const desiredHeight = headerHeight + visibleCount * ROW_HEIGHT + 16 // padding
        const availableHeight = container.clientHeight

        const maxH = Math.max(0, Math.min(desiredHeight, availableHeight))
        el.style.maxHeight = `${maxH}px`
        setIsOverflowing(desiredHeight > availableHeight)

        const check = () => {
            const visibleCountNow = countVisibleNodes(files)
            const desiredNow = headerHeight + visibleCountNow * ROW_HEIGHT + 16
            const availNow = container.clientHeight
            el.style.maxHeight = `${Math.max(0, Math.min(desiredNow, availNow))}px`
            setIsOverflowing(desiredNow > availNow)
        }

        const ro = new (window as any).ResizeObserver(() => check())
        ro.observe(container)
        ro.observe(el)
        window.addEventListener('resize', check)

        return () => {
            ro.disconnect()
            window.removeEventListener('resize', check)
        }
    }, [files, expandedFolders])

    const openRenameModal = (path: string, name: string) => {
        setRenameTarget({ path, name })
        setRenameValue(name)
    }

    // derived rename validation
    const renameBaseName = renameValue.trim() ? (renameValue.trim().split('/').pop() || '') : ''
    const renameBaseIsOnlyDots = renameBaseName !== '' && /^[.]+$/.test(renameBaseName)

    const closeRenameModal = () => {
        setRenameTarget(null)
        setRenameValue('')
        try { localStorage.removeItem('djs_rename_draft') } catch (e) { }
    }

    const showErrorAndCloseRename = (msg: string) => {
        // Close the rename modal first so the portaled ErrorModal is visible on top
        closeRenameModal()
        setErrorMessage(msg)
        // small delay to ensure modal DOM updated before opening error modal
        setTimeout(() => setShowErrorModal(true), 50)
    }

    const submitRename = () => {
        if (!renameTarget) return
        const trimmed = renameValue.trim()
        // Disallow creating folders via rename: no slashes allowed
        if (trimmed.includes('/')) {
            showErrorAndCloseRename('Renaming cannot change folder structure. Create folders using the New Folder action.')
            return
        }

        // Prevent renaming to empty or dot-only names like '.' or '...'
        const baseCandidate = trimmed || ''
        if (!baseCandidate || /^[.]+$/.test(baseCandidate)) {
            showErrorAndCloseRename('Invalid filename. Filenames cannot be empty or consist only of dots.')
            return
        }

        if (trimmed && trimmed !== renameTarget.name) {
            // enforce filename limit
            if (trimmed.length > 50) {
                showErrorAndCloseRename(`Filename is too long (${trimmed.length}/50). Shorten the name.`)
                return
            }
            const lastSlashIndex = renameTarget.path.lastIndexOf('/')
            const dirPath = lastSlashIndex > -1 ? renameTarget.path.substring(0, lastSlashIndex + 1) : ''
            const newPath = `${dirPath}${trimmed}`
            onRenameFile?.(renameTarget.path, newPath)
        }
        closeRenameModal()
    }

    return (
        // ensure tooltips can render outside the explorer card
        <div ref={containerRef} className="flex flex-col h-full bg-base-100 overflow-visible">
            {/* Enhanced header */}
            <div ref={headerRef} className="px-4 py-3 border-b border-base-300/50 bg-base-200/30 flex flex-col gap-2 overflow-visible">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-base-content/90 uppercase tracking-wider">Explorer</h3>
                </div>
                {!isReadOnly && onAddFile && (
                    <button
                        onClick={() => onAddFile('.')}
                        className="btn btn-xs w-full justify-start rounded-xl gap-2 px-3 py-2 min-h-[40px] border border-base-400 dark:border-white/5 hover:border-base-500 dark:hover:border-white/30 hover:bg-base-200/40 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm">New File</span>
                    </button>
                )}
            </div>

            {/* File list wrapper - scrollable but allows overflow for tooltips */}
            <div className="flex-1 flex flex-col">
                <div
                    ref={listRef}
                    className={`flex-1 px-2 py-3 space-y-1 ${isOverflowing ? 'overflow-y-auto' : 'overflow-y-hidden'} overflow-x-hidden`}
                    style={{ WebkitOverflowScrolling: isOverflowing ? 'touch' : undefined }}
                >
                    {files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8">
                            <svg className="w-12 h-12 text-base-content/20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-xs text-base-content/50">No files yet</p>
                            {!isReadOnly && <p className="text-xs text-base-content/40 mt-1">Click "New File" to start</p>}
                        </div>
                    ) : (
                        files.map(node => (
                            <div key={node.path}>
                                <FileTreeNode
                                    node={node}
                                    level={0}
                                    activeFile={activeFile}
                                    onFileSelect={onFileSelect}
                                    onAddFile={onAddFile}
                                    onDeleteFile={onDeleteFile}
                                    onRenameFile={onRenameFile}
                                    onRequestRename={openRenameModal}
                                    isReadOnly={isReadOnly}
                                    openFiles={openFiles}
                                    filesCount={files.length}
                                    isExpanded={isFolderExpanded(node.path)}
                                    onToggleExpand={toggleFolder}
                                    isFolderExpanded={isFolderExpanded}
                                />
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Rename Modal (portalled so it escapes the mobile drawer) */}
            {mounted && createPortal(
                <>
                    <input
                        type="checkbox"
                        id={modalId}
                        className="modal-toggle"
                        checked={!!renameTarget}
                        onChange={(e) => {
                            // unchecking closes modal
                            if (!e.target.checked) closeRenameModal()
                        }}
                    />

                    <div className="modal">
                        <div className="modal-box rounded-2xl max-w-lg">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Rename File</h3>
                                    <p className="text-sm text-base-content/70">Rename <span className="font-mono">{renameTarget?.name}</span></p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <input
                                    type="text"
                                    value={renameValue}
                                    onChange={(e) => {
                                        const v = e.target.value
                                        // enforce filename max length client-side (50)
                                        if (v.length <= 50) {
                                            setRenameValue(v)
                                            try {
                                                if (renameTarget) {
                                                    localStorage.setItem('djs_rename_draft', JSON.stringify({ path: renameTarget.path, name: v, timestamp: Date.now() }))
                                                }
                                            } catch (err) {
                                                // ignore storage errors
                                            }
                                        }
                                    }}
                                    className="input input-bordered w-full rounded-xl mb-2 validator"
                                    maxLength={50}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') submitRename()
                                        if (e.key === 'Escape') closeRenameModal()
                                    }}
                                />
                                <span className="text-xs text-base-content/60 ml-3">{renameValue.length}/50</span>
                            </div>
                            {renameBaseIsOnlyDots && (
                                <div className="mt-3 p-3 bg-error/10 border border-error/30 rounded-lg">
                                    <p className="text-sm text-error">Invalid filename: <span className="font-mono font-semibold">{renameBaseName || renameValue}</span>. Filenames cannot be empty or consist only of dots.</p>
                                </div>
                            )}
                            <p className="validator-hint text-xs text-base-content/60 mb-2">Filename max 50 characters</p>
                            <div className="modal-action mt-2">
                                <button type="button" className="btn btn-ghost rounded-xl" onClick={() => { closeRenameModal(); try { localStorage.removeItem('djs_rename_draft') } catch (e) { } }}>Cancel</button>
                                <button
                                    type="button"
                                    className="btn btn-primary rounded-xl"
                                    onClick={() => { submitRename(); try { localStorage.removeItem('djs_rename_draft') } catch (e) { } }}
                                    disabled={!renameValue.trim() || renameBaseIsOnlyDots || renameValue.trim().length > 50}
                                >
                                    Rename
                                </button>
                            </div>
                        </div>
                        <label className="modal-backdrop" htmlFor={modalId}></label>
                    </div>
                </>,
                // portal target
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                document.body
            )}
        </div>
    )
}
