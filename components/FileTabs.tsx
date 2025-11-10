'use client'

import React from 'react'

interface OpenFile {
    path: string
    name: string
    isDirty?: boolean
}

interface FileTabsProps {
    openFiles: OpenFile[]
    activeFile?: string
    onTabClick: (path: string) => void
    onTabClose: (path: string) => void
}

export default function FileTabs({
    openFiles,
    activeFile,
    onTabClick,
    onTabClose,
}: FileTabsProps) {
    if (openFiles.length === 0) {
        return null
    }

    // Sort files alphabetically by name for consistent display
    const sortedFiles = [...openFiles].sort((a, b) => a.name.localeCompare(b.name))

    return (
        <div role="tablist" className="tabs tabs-border px-2 sm:px-4 py-3 bg-base-200 border-b border-base-300 overflow-x-auto gap-3 sm:gap-4">
            {sortedFiles.map(file => (
                <div
                    key={file.path}
                    role="tab"
                    onClick={() => onTabClick(file.path)}
                    className={`
            tab gap-2 px-3 sm:px-4 py-2 flex items-center cursor-pointer
            ${activeFile === file.path
                            ? 'tab-active text-primary font-semibold'
                            : 'border border-base-300 rounded-lg'
                        }
          `}
                >
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                        {file.isDirty && <span className="text-primary text-lg leading-none">●</span>}
                    </div>
                    <button
                        onClick={e => {
                            e.stopPropagation()
                            onTabClose(file.path)
                        }}
                        className="btn btn-ghost btn-xs rounded-xl opacity-50 hover:opacity-100 ml-1"
                        title="Close tab"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    )
}
