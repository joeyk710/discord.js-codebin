'use client'

import React, { useState, useCallback } from 'react'
import { FileNode, getLanguageIcon } from '@/lib/fileTree'

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
                <span className="w-4 text-center">{getLanguageIcon(node.language || 'javascript')}</span>
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
                    >
                        ▶
                    </button>
                )}
                {isFile && <span className="w-4 text-center">{getLanguageIcon(node.language || 'javascript')}</span>}

                <span className="flex-1 text-left text-sm truncate">
                    {node.name}
                </span>

                {!isReadOnly && isFile && (
                    <div className="flex items-center gap-1 opacity-0 hover:opacity-100">
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
