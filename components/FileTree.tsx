'use client'

import React, { useState, useCallback } from 'react'
import { FileNode, getLanguageIcon, getMaterialIconFilename } from '@/lib/fileTree'

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
}: {
    node: FileNode
    level: number
    activeFile?: string
    onFileSelect: (path: string) => void
    onAddFile?: (folderPath: string) => void
    onDeleteFile?: (path: string) => void
    onRenameFile?: (oldPath: string, newPath: string) => void
    isReadOnly?: boolean
}) {
    const [expanded, setExpanded] = useState(level === 0)
    const [isRenaming, setIsRenaming] = useState(false)
    const [newName, setNewName] = useState(node.name)
    const isFile = node.type === 'file'
    const isActive = activeFile === node.path

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
                    const lang = (node.language || 'javascript').toLowerCase()
                    const mapped = lang === 'c++' || lang === 'cpp' ? 'cpp' : lang === 'c#' || lang === 'csharp' ? 'csharp' : lang === 'objectivec' ? 'objective-c' : lang === 'dockerfile' ? 'docker' : lang
                    if (MATERIAL_ICON_LANGS.has(mapped)) {
                        return <img src={`/material-icons/${mapped}.svg`} alt={node.language} className="w-4 h-4" />
                    }
                    return <span className="w-4 text-center">{getLanguageIcon(node.language || 'javascript')}</span>
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
          flex items-center gap-2 px-3 py-2 rounded-lg transition-all
          ${isFile ? 'cursor-pointer hover:bg-base-300' : 'hover:bg-base-200'}
          ${isActive && isFile ? 'bg-primary text-primary-content font-semibold shadow-md' : ''}
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
                            const lang = (node.language || 'javascript').toLowerCase()
                            const mapped = lang === 'c++' || lang === 'cpp' ? 'cpp' : lang === 'c#' || lang === 'csharp' ? 'csharp' : lang === 'objectivec' ? 'objective-c' : lang === 'dockerfile' ? 'docker' : lang
                            if (MATERIAL_ICON_LANGS.has(mapped)) {
                                return (
                                    <img src={`/material-icons/${mapped}.svg`} alt={node.language} className="w-4 h-4" title={node.language} />
                                )
                            }
                            return (
                                <span className="w-4 text-center" title={node.language}>{getLanguageIcon(node.language || 'javascript')}</span>
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
                            className="btn btn-ghost btn-xs rounded-xl"
                            title="Rename file"
                        >
                            ✏️
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                onDeleteFile?.(node.path)
                            }}
                            className="btn btn-ghost btn-xs rounded-xl"
                            title="Delete file"
                        >
                            ✕
                        </button>
                    </div>
                )}
            </div>

            {!isFile && expanded && node.children && (
                <div>
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
}: FileTreeProps) {
    return (
        <div className="flex flex-col h-full bg-base-100 border-r border-base-300">
            <div className="p-4 border-b border-base-300">
                <h3 className="font-semibold text-sm mb-3">Files</h3>
                {!isReadOnly && onAddFile && (
                    <button
                        onClick={() => onAddFile('.')}
                        className="btn btn-sm btn-primary w-full rounded-xl"
                    >
                        + New File
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                {files.length === 0 ? (
                    <p className="text-xs text-base-content/50 p-4">No files</p>
                ) : (
                    files.map(node => (
                        <FileTreeNode
                            key={node.path}
                            node={node}
                            level={0}
                            activeFile={activeFile}
                            onFileSelect={onFileSelect}
                            onAddFile={onAddFile}
                            onDeleteFile={onDeleteFile}
                            onRenameFile={onRenameFile}
                            isReadOnly={isReadOnly}
                        />
                    ))
                )}
            </div>
        </div>
    )
}
