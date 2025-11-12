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
        <div role="tablist" className="flex items-center px-3 sm:px-4 py-0 bg-base-200/50 backdrop-blur-sm border-b border-base-300/30 overflow-x-auto overflow-y-visible gap-1 min-h-[48px]">
            {sortedFiles.map(file => (
                <div
                    key={file.path}
                    role="tab"
                    onClick={() => onTabClick(file.path)}
                    className={`
            group relative flex items-center gap-2 px-3 sm:px-4 py-2.5 cursor-pointer transition-all duration-200 min-w-fit
            ${activeFile === file.path
                            ? 'bg-base-100 text-base-content font-medium shadow-sm border-t-2 border-t-primary'
                            : 'hover:bg-base-300/40 text-base-content/70 hover:text-base-content border-t-2 border-t-transparent'
                        }
          `}
                >
                    {/* Icon and name */}
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

                            if (MATERIAL_ICON_LANGS.has(mapped)) {
                                return (
                                    <img
                                        src={`/material-icons/${mapped}.svg`}
                                        alt={file.language}
                                        className={`w-4 h-4 transition-opacity ${activeFile === file.path ? 'opacity-100' : 'opacity-70 group-hover:opacity-90'}`}
                                        title={file.language}
                                    />
                                )
                            }

                            return <span className="text-base">{getEmojiIcon(file.language)}</span>
                        })()
                    ) : <span className="w-4 h-4" />}

                    <span className="text-sm truncate max-w-[140px] sm:max-w-xs">
                        {file.name}
                    </span>

                    {file.isDirty && (
                        <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" title="Unsaved changes"></span>
                    )}

                    {/* Close button - hidden until hover */}
                    <button
                        onClick={e => {
                            e.stopPropagation()
                            onTabClose(file.path)
                        }}
                        className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-base-content/10 rounded p-0.5"
                        aria-label="Close tab"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            ))}
        </div>
    )
}
