'use client'

import React from 'react'
import { getLanguageIcon as getEmojiIcon } from '@/lib/fileTree'

// languages that have material icons in public/material-icons
const MATERIAL_ICON_LANGS = new Set([
    'javascript', 'typescript', 'python', 'java', 'cpp', 'csharp', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin', 'scala', 'r', 'matlab', 'objective-c', 'groovy', 'clojure', 'haskell', 'elixir', 'erlang', 'ocaml', 'scheme', 'lisp', 'lua', 'perl', 'powershell', 'pascal', 'cobol', 'fortran', 'ada', 'prolog', 'dart', 'solidity', 'webassembly', 'html', 'css', 'sass', 'less', 'json', 'xml', 'yaml', 'toml', 'markdown', 'graphql', 'docker', 'makefile'
])

interface OpenFile {
    path: string
    name: string
    isDirty?: boolean
    language?: string
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
        <div role="tablist" className="tabs tabs-border px-2 sm:px-4 py-3 bg-base-200 border-b border-base-300 overflow-x-auto overflow-y-visible gap-3 sm:gap-4">
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
                    {/* Icon on the left */}
                    <div className="flex items-center gap-2 min-w-0">
                        {file.language ? (
                            (() => {
                                const langKey = file.language.toLowerCase()
                                const mapped = (() => {
                                    if (langKey === 'c++' || langKey === 'cpp') return 'cpp'
                                    if (langKey === 'c#' || langKey === 'csharp') return 'csharp'
                                    if (langKey === 'objective-c' || langKey === 'objectivec') return 'objective-c'
                                    if (langKey === 'dockerfile') return 'docker'
                                    if (langKey === 'powershell') return 'powershell'
                                    if (langKey === 'webassembly') return 'webassembly'
                                    return langKey
                                })()

                                const tooltipLabel = file.language

                                if (MATERIAL_ICON_LANGS.has(mapped)) {
                                    return (
                                        <div className="tooltip z-50" data-tip={tooltipLabel}>
                                            <img src={`/material-icons/${mapped}.svg`} alt={file.language} className="w-5 h-5 opacity-90" />
                                        </div>
                                    )
                                }

                                return (
                                    <div className="tooltip z-50" data-tip={tooltipLabel}>
                                        <span className="text-lg">{getEmojiIcon(file.language)}</span>
                                    </div>
                                )
                            })()
                        ) : <span className="w-5 h-5" />}

                        <span className="text-sm truncate max-w-xs">{file.name}</span>
                        {file.isDirty && <span className="text-primary text-lg leading-none">●</span>}
                    </div>

                    <div className="tooltip z-50" data-tip="Close tab">
                        <button
                            onClick={e => {
                                e.stopPropagation()
                                onTabClose(file.path)
                            }}
                            className="btn btn-ghost btn-xs rounded-xl opacity-50 hover:opacity-100 ml-1"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    )
}
