'use client'

import React, { useState, useCallback } from 'react'
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
    isReadOnly,
    openFiles,
}: {
    node: FileNode
    level: number
    activeFile?: string
    onFileSelect: (path: string) => void
    onAddFile?: (folderPath: string) => void
    onDeleteFile?: (path: string) => void
    onRenameFile?: (oldPath: string, newPath: string) => void
    isReadOnly?: boolean
    openFiles?: string[]
}) {
    const [expanded, setExpanded] = useState(level === 0)
    const [isRenaming, setIsRenaming] = useState(false)
    const [newName, setNewName] = useState(node.name)
    const isFile = node.type === 'file'
    const isActive = activeFile === node.path
    const isOpen = !!openFiles?.includes(node.path)

    const handleRename = () => {
        if (newName.trim() && newName !== node.name) {
            const lastSlashIndex = node.path.lastIndexOf('/')
            const dirPath = lastSlashIndex > -1 ? node.path.substring(0, lastSlashIndex + 1) : ''
            const newPath = `${dirPath}${newName.trim()}`
            onRenameFile?.(node.path, newPath)
        }
        setIsRenaming(false)
        setNewName(node.name)
    }

    if (isFile && isRenaming) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}>
                {/* Icon left of editable filename */}
                {(() => {
                    // Prefer explicit node.language, otherwise infer from filename extension
                    const explicit = node.language ? node.language.toLowerCase() : null
                    const inferred = inferLanguageFromFilename(node.name)
                    const lang = explicit || inferred || 'javascript'
                    const mapped = lang === 'c++' || lang === 'cpp' ? 'cpp' : lang === 'c#' || lang === 'csharp' ? 'csharp' : lang === 'objectivec' ? 'objective-c' : lang === 'dockerfile' ? 'docker' : lang
                    if (MATERIAL_ICON_LANGS.has(mapped)) {
                        return (
                            <img src={`/material-icons/${mapped}.svg`} alt={lang} className="w-4 h-4" />
                        )
                    }
                    return <span className="w-4 text-center">{getLanguageIcon(lang)}</span>
                })()}
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleRename}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleRename()
                        } else if (e.key === 'Escape') {
                            setIsRenaming(false)
                            setNewName(node.name)
                        }
                    }}
                    className="input input-sm input-bordered flex-1 h-6 py-1"
                    autoFocus
                />
            </div>
        )
    }

    return (
        <div key={node.path}>
            <div
                className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg border border-base-300/10 dark:border-white/5 transition-colors relative focus:outline-none focus:ring-0
                    ${isFile ? 'cursor-pointer hover:bg-base-300/60' : 'hover:bg-base-200/40'}
                    ${isActive && isFile ? 'bg-base-200/50 text-base-content/80 border-l-2 border-base-300' : ''}
                `}
                style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
                onClick={() => isFile && onFileSelect(node.path)}
            >
                {!isFile && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation()
                            setExpanded(!expanded)
                        }}
                        className="p-0 w-4 h-4 flex items-center justify-center hover:bg-base-300 rounded transition-transform duration-200"
                        style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}
                        title={expanded ? 'Collapse' : 'Expand'}
                    >
                        ▶
                    </button>
                )}
                {isFile && (
                    <div className="mr-2">
                        {(() => {
                            const explicit = node.language ? node.language.toLowerCase() : null
                            const inferred = inferLanguageFromFilename(node.name)
                            const lang = explicit || inferred || 'javascript'
                            const mapped = lang === 'c++' || lang === 'cpp' ? 'cpp' : lang === 'c#' || lang === 'csharp' ? 'csharp' : lang === 'objectivec' ? 'objective-c' : lang === 'dockerfile' ? 'docker' : lang
                            if (MATERIAL_ICON_LANGS.has(mapped)) {
                                return (
                                    <img src={`/material-icons/${mapped}.svg`} alt={lang} className="w-4 h-4" title={lang} />
                                )
                            }
                            return (
                                <span className="w-4 text-center" title={lang}>{getLanguageIcon(lang)}</span>
                            )
                        })()}
                    </div>
                )}

                <span className="flex-1 text-left text-sm truncate">
                    {node.name}
                </span>

                {!isReadOnly && isFile && (
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsRenaming(true)
                            }}
                            className="btn btn-ghost btn-xs rounded-xl border border-base-300 dark:border-white/20"
                            title="Rename file"
                            aria-label="Rename file"
                        >
                            <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDeleteFile?.(node.path)
                            }}
                            className="btn btn-ghost btn-xs rounded-xl border border-base-300 dark:border-white/20"
                            title="Delete file"
                            aria-label="Delete file"
                        >
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>

            {!isFile && expanded && node.children && (
                <div className="space-y-1">
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
                            isReadOnly={isReadOnly}
                            openFiles={openFiles}
                        />
                    ))}
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
    return (
        <div className="flex flex-col h-full bg-base-100">
            {/* Enhanced header */}
            <div className="px-4 py-3 border-b border-base-300/50 bg-base-200/30 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm text-base-content/90 uppercase tracking-wider">Explorer</h3>
                </div>
                {!isReadOnly && onAddFile && (
                    <button
                        onClick={() => onAddFile('.')}
                        className="btn btn-xs w-full justify-start rounded-xl gap-2 px-3 py-2 min-h-[40px] border border-base-300 dark:border-white/20 hover:border-base-400 dark:hover:border-white/30 hover:bg-base-200/40 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm">New File</span>
                    </button>
                )}
            </div>

            {/* File list */}
            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
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
                                isReadOnly={isReadOnly}
                                openFiles={openFiles}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}
