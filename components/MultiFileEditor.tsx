'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import CodeEditor from './CodeEditor'
import FileTabs from './FileTabs'
import FileTree from './FileTree'
import SuggestionsModal from './SuggestionsModal'
import LanguageSelectorModal from './LanguageSelectorModal'
import { getMaterialIconFilename } from '@/lib/fileTree'
import { buildFileTree, FileNode } from '@/lib/fileTree'
import { analyzeDiscordJsCode, type Suggestion } from '@/lib/analyzer'

interface FileData {
    id: string
    path: string
    name: string
    code: string
    language: string
}

interface MultiFileEditorProps {
    initialFiles: FileData[]
    isReadOnly?: boolean
    onFilesChange?: (files: FileData[]) => void
}

interface OpenFile {
    path: string
    name: string
    isDirty?: boolean
    language?: string
}

const LANGUAGES = ['JavaScript', 'TypeScript', 'JSON', 'Python', 'HTML', 'CSS', 'Markdown']

export default function MultiFileEditor({
    initialFiles,
    isReadOnly = false,
    onFilesChange,
}: MultiFileEditorProps) {
    const [files, setFiles] = useState<FileData[]>(initialFiles)
    const [openFiles, setOpenFiles] = useState<OpenFile[]>(
        initialFiles.slice(0, 1).map(f => ({ path: f.path, name: f.name, language: f.language }))
    )
    const [activeFile, setActiveFile] = useState<string>(initialFiles[0]?.path || '')
    const [fileTree, setFileTree] = useState<FileNode[]>([])
    const [showNewFileDialog, setShowNewFileDialog] = useState(false)
    const [newFilePath, setNewFilePath] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)
    const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const newFileInputRef = useRef<HTMLInputElement>(null)
    const newFileModalRef = useRef<HTMLInputElement>(null)
    const deleteErrorModalRef = useRef<HTMLDialogElement>(null)
    const languageModalRef = useRef<HTMLDialogElement>(null)

    // Build file tree
    useEffect(() => {
        const tree = buildFileTree(
            files.map(f => ({
                id: f.id,
                path: f.path,
                name: f.name,
                language: f.language,
            }))
        )
        setFileTree(tree)
    }, [files])

    // Update parent when files change
    useEffect(() => {
        onFilesChange?.(files)
    }, [files, onFilesChange])

    // Handle modal state
    useEffect(() => {
        if (newFileModalRef.current) {
            newFileModalRef.current.checked = showNewFileDialog
        }
    }, [showNewFileDialog])

    useEffect(() => {
        if (showNewFileDialog) {
            setTimeout(() => newFileInputRef.current?.focus(), 0)
        }
    }, [showNewFileDialog])

    const currentFile = files.find(f => f.path === activeFile)

    // Analyze code when active file changes
    useEffect(() => {
        const analyzeCode = async () => {
            if (!currentFile || isReadOnly) return

            try {
                setIsAnalyzing(true)
                const results = await analyzeDiscordJsCode(currentFile.code)
                setSuggestions(results)
            } catch (error) {
                console.error('Error analyzing code:', error)
            } finally {
                setIsAnalyzing(false)
            }
        }

        analyzeCode()
    }, [activeFile, currentFile, isReadOnly])

    // Get file extension for language
    const getExtensionForLanguage = (lang: string): string => {
        const extensionMap: { [key: string]: string } = {
            'javascript': 'js',
            'typescript': 'ts',
            'json': 'json',
            'python': 'py',
            'html': 'html',
            'css': 'css',
            'markdown': 'md',
            'c++': 'cpp',
            'c': 'c',
            'c#': 'cs',
            'php': 'php',
            'ruby': 'rb',
            'go': 'go',
            'rust': 'rs',
            'swift': 'swift',
            'kotlin': 'kt',
            'scala': 'scala',
            'r': 'r',
            'matlab': 'm',
            'objective-c': 'm',
            'groovy': 'groovy',
            'clojure': 'clj',
            'haskell': 'hs',
            'elixir': 'ex',
            'erlang': 'erl',
            'f#': 'fs',
            'ocaml': 'ml',
            'scheme': 'scm',
            'lisp': 'lisp',
            'lua': 'lua',
            'perl': 'pl',
            'shell': 'sh',
            'bash': 'sh',
            'powershell': 'ps1',
            'vb.net': 'vb',
            'delphi': 'pas',
            'pascal': 'pas',
            'cobol': 'cob',
            'fortran': 'f90',
            'ada': 'adb',
            'prolog': 'pl',
            'dart': 'dart',
            'solidity': 'sol',
            'webassembly': 'wasm',
            'scss': 'scss',
            'sass': 'sass',
            'less': 'less',
            'xml': 'xml',
            'yaml': 'yaml',
            'toml': 'toml',
            'sql': 'sql',
            'graphql': 'graphql',
            // special cases - no extension desired (Dockerfile/Makefile)
            'dockerfile': '',
            'makefile': '',
        }

        return extensionMap[lang.toLowerCase()] ?? 'txt'
    }

    // Get new file path with updated extension
    const getPathWithExtension = (path: string, language: string): string => {
        const lastSlashIndex = path.lastIndexOf('/')
        const dirname = lastSlashIndex > -1 ? path.substring(0, lastSlashIndex + 1) : ''
        const filename = lastSlashIndex > -1 ? path.substring(lastSlashIndex + 1) : path
        const nameWithoutExt = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename
        const ext = getExtensionForLanguage(language)
        if (!ext) {
            // No extension (Dockerfile, Makefile, etc.) - return filename without extension
            return `${dirname}${nameWithoutExt}`
        }

        return `${dirname}${nameWithoutExt}.${ext}`
    }

    const handleFileSelect = useCallback((path: string) => {
        setActiveFile(path)
        // Add to open files if not already there
        if (!openFiles.find(f => f.path === path)) {
            const file = files.find(f => f.path === path)
            if (file) {
                setOpenFiles([...openFiles, { path, name: file.name, language: file.language }])
            }
        }
    }, [files, openFiles])

    const handleTabClose = useCallback(
        (path: string) => {
            const newTabs = openFiles.filter(f => f.path !== path)
            setOpenFiles(newTabs)

            if (activeFile === path && newTabs.length > 0) {
                setActiveFile(newTabs[newTabs.length - 1].path)
            } else if (newTabs.length === 0) {
                setActiveFile('')
            }
        },
        [activeFile, openFiles]
    )

    const handleCodeChange = useCallback(
        (newCode: string) => {
            if (isReadOnly) return

            setFiles(files.map(f =>
                f.path === activeFile
                    ? { ...f, code: newCode }
                    : f
            ))

            // Mark as dirty
            setOpenFiles(openFiles.map(f =>
                f.path === activeFile
                    ? { ...f, isDirty: true }
                    : f
            ))
        },
        [files, activeFile, openFiles, isReadOnly]
    )

    const handleAddFile = useCallback(() => {
        setShowNewFileDialog(true)
        setTimeout(() => newFileInputRef.current?.focus(), 0)
    }, [])

    const handleCloseNewFileModal = useCallback(() => {
        setShowNewFileDialog(false)
        setNewFilePath('')
        if (newFileModalRef.current) {
            newFileModalRef.current.checked = false
        }
    }, [])

    const handleCreateNewFile = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault()
            if (!newFilePath.trim()) return

            const fileName = newFilePath.split('/').pop() || newFilePath
            const newFile: FileData = {
                id: `file-${Date.now()}`,
                path: newFilePath.trim(),
                name: fileName,
                code: '',
                language: 'javascript',
            }

            setFiles([...files, newFile])
            handleFileSelect(newFile.path)
            setNewFilePath('')
            handleCloseNewFileModal()
        },
        [files, newFilePath, handleFileSelect]
    )

    const handleDeleteFile = useCallback(
        (path: string) => {
            if (files.length <= 1) {
                setShowDeleteErrorModal(true)
                if (deleteErrorModalRef.current) {
                    deleteErrorModalRef.current.showModal()
                }
                return
            }

            setFiles(files.filter(f => f.path !== path))
            handleTabClose(path)
        },
        [files, handleTabClose]
    )

    const handleRenameFile = useCallback(
        (oldPath: string, newPath: string) => {
            setFiles(files.map(f =>
                f.path === oldPath
                    ? { ...f, path: newPath, name: newPath.split('/').pop() || newPath }
                    : f
            ))

            // Update active file path if renaming the active file
            if (activeFile === oldPath) {
                setActiveFile(newPath)
            }

            // Update open files
            setOpenFiles(openFiles.map(f =>
                f.path === oldPath
                    ? { ...f, path: newPath, name: newPath.split('/').pop() || newPath }
                    : f
            ))
        },
        [files, activeFile, openFiles]
    )

    const handleLanguageSelect = useCallback(
        (language: string) => {
            if (!currentFile) return

            const langValue = language.toLowerCase()
            const updatedFiles = files.map(f =>
                f.path === activeFile
                    ? {
                        ...f,
                        language: langValue,
                        path: getPathWithExtension(f.path, langValue),
                        name: getPathWithExtension(f.path, langValue).split('/').pop() || f.name,
                    }
                    : f
            )
            setFiles(updatedFiles)

            // Update active file path if it changed
            const updatedFile = updatedFiles.find(f => f.id === currentFile.id)
            if (updatedFile && updatedFile.path !== activeFile) {
                setActiveFile(updatedFile.path)
                // Update open files tab
                setOpenFiles(openFiles.map(f =>
                    f.path === activeFile
                        ? { ...f, path: updatedFile.path, name: updatedFile.name, language: updatedFile.language }
                        : f
                ))
            }
        },
        [currentFile, activeFile, files, openFiles]
    )

    return (
        <div className="flex flex-col h-full w-full">
            <FileTabs
                openFiles={openFiles}
                activeFile={activeFile}
                onTabClick={handleFileSelect}
                onTabClose={handleTabClose}
            />

            {/* Drawer wrapper - mobile only */}
            <div className="drawer md:hidden flex-1 overflow-hidden">
                <input id="file-drawer" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content flex flex-1 overflow-hidden flex-col">
                    {/* Editor */}
                    <div className="flex-1 flex flex-col overflow-hidden w-full">
                        {currentFile ? (
                            <>
                                <div className="px-2 sm:px-4 py-2 sm:py-3 bg-base-200 border-b border-base-300 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <label htmlFor="file-drawer" className="btn btn-ghost btn-square p-0 w-9 h-9 flex-shrink-0 md:hidden flex items-center justify-center cursor-pointer">
                                            <Bars3Icon className="w-5 h-5" />
                                        </label>
                                        <div className="text-xs sm:text-sm text-base-content/70 flex-1 truncate min-w-0">
                                            {currentFile.path}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 flex-wrap">
                                        <button
                                            onClick={() => setShowSuggestionsModal(true)}
                                            disabled={isAnalyzing || suggestions.length === 0}
                                            className="btn btn-xs sm:btn-sm btn-outline rounded-xl gap-1 sm:gap-2"
                                            title="View code suggestions"
                                        >
                                            {isAnalyzing ? (
                                                <>
                                                    <span className="loading loading-spinner loading-xs sm:loading-sm"></span>
                                                    <span className="hidden sm:inline">Analyzing...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span>💡</span>
                                                    <span className="hidden xs:inline">{suggestions.length > 0 ? suggestions.length : 'View'}</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            onClick={() => languageModalRef.current?.showModal()}
                                            className="btn btn-xs sm:btn-sm btn-outline rounded-xl gap-1 sm:gap-2 min-w-[44px] h-9 z-50 pointer-events-auto flex items-center"
                                            aria-label={`Select language (${currentFile.language})`}
                                            disabled={isReadOnly}
                                        >
                                            {/* tooltip only on the icon so the bubble won't overlap the label */}
                                            {(() => {
                                                const mapped = getMaterialIconFilename(currentFile.language) || null
                                                if (mapped) {
                                                    return (
                                                        <div className="tooltip tooltip-bottom md:tooltip-right z-50 mr-1 pointer-events-none" data-tip={currentFile.language}>
                                                            <img src={`/material-icons/${mapped}.svg`} alt={currentFile.language} className="w-5 h-5 pointer-events-auto" />
                                                        </div>
                                                    )
                                                }
                                                return (
                                                    <div className="tooltip tooltip-bottom md:tooltip-right z-50 mr-1 pointer-events-none" data-tip={currentFile.language}>
                                                        <span className="w-5 h-5 inline-flex items-center justify-center pointer-events-auto">🔤</span>
                                                    </div>
                                                )
                                            })()}

                                            <span className="hidden sm:inline">{currentFile.language.charAt(0).toUpperCase() + currentFile.language.slice(1)}</span>
                                            <span className="sm:hidden ml-1">{currentFile.language.slice(0, 3).toUpperCase()}</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <CodeEditor
                                        value={currentFile.code}
                                        onChange={handleCodeChange}
                                        language={currentFile.language}
                                    />
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center justify-center flex-1 text-base-content/50">
                                <p>No file selected</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Drawer sidebar - mobile only */}
                <div className="drawer-side md:hidden">
                    <label htmlFor="file-drawer" className="drawer-overlay"></label>
                    <div className="w-64 bg-base-100 border-r border-base-300 flex flex-col h-screen overflow-y-auto">
                        <FileTree
                            files={fileTree}
                            activeFile={activeFile}
                            onFileSelect={handleFileSelect}
                            onAddFile={handleAddFile}
                            onDeleteFile={handleDeleteFile}
                            onRenameFile={handleRenameFile}
                            isReadOnly={isReadOnly}
                        />
                    </div>
                </div>
            </div>

            {/* Desktop sidebar + Editor layout */}
            <div className="hidden md:flex flex-1 overflow-hidden">
                {/* File Tree Sidebar - desktop only */}
                <div className="w-64 min-w-64 border-r border-base-300">
                    <FileTree
                        files={fileTree}
                        activeFile={activeFile}
                        onFileSelect={handleFileSelect}
                        onAddFile={handleAddFile}
                        onDeleteFile={handleDeleteFile}
                        onRenameFile={handleRenameFile}
                        isReadOnly={isReadOnly}
                    />
                </div>

                {/* Editor */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {currentFile ? (
                        <>
                            <div className="px-2 sm:px-4 py-2 sm:py-3 bg-base-200 border-b border-base-300 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
                                <div className="text-xs sm:text-sm text-base-content/70 flex-1 truncate min-w-0">
                                    {currentFile.path}
                                </div>
                                <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 flex-wrap">
                                    <button
                                        onClick={() => setShowSuggestionsModal(true)}
                                        disabled={isAnalyzing || suggestions.length === 0}
                                        className="btn btn-xs sm:btn-sm btn-outline rounded-xl gap-1 sm:gap-2"
                                        title="View code suggestions"
                                    >
                                        {isAnalyzing ? (
                                            <>
                                                <span className="loading loading-spinner loading-xs sm:loading-sm"></span>
                                                <span className="hidden sm:inline">Analyzing...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span>💡</span>
                                                <span className="hidden xs:inline">{suggestions.length > 0 ? suggestions.length : 'View'}</span>
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => languageModalRef.current?.showModal()}
                                        className="btn btn-xs sm:btn-sm btn-outline rounded-xl gap-1 sm:gap-2 min-w-[44px] h-9 z-50 pointer-events-auto flex items-center"
                                        aria-label={`Select language (${currentFile.language})`}
                                        disabled={isReadOnly}
                                    >
                                        {(() => {
                                            const mapped = getMaterialIconFilename(currentFile.language) || null
                                            if (mapped) {
                                                return (
                                                    <div className="tooltip tooltip-bottom md:tooltip-right z-50 mr-1 pointer-events-none" data-tip={currentFile.language}>
                                                        <img src={`/material-icons/${mapped}.svg`} alt={currentFile.language} className="w-5 h-5 pointer-events-auto" />
                                                    </div>
                                                )
                                            }
                                            return (
                                                <div className="tooltip tooltip-bottom md:tooltip-right z-50 mr-1 pointer-events-none" data-tip={currentFile.language}>
                                                    <span className="w-5 h-5 inline-flex items-center justify-center pointer-events-auto">🔤</span>
                                                </div>
                                            )
                                        })()}

                                        <span className="hidden sm:inline">{currentFile.language.toUpperCase()}</span>
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <CodeEditor
                                    value={currentFile.code}
                                    onChange={handleCodeChange}
                                    language={currentFile.language}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center flex-1 text-base-content/50">
                            <p>No file selected</p>
                        </div>
                    )}
                </div>
            </div>

            {/* New File Dialog */}
            <input
                ref={newFileModalRef}
                type="checkbox"
                id="new_file_modal"
                className="modal-toggle"
            />
            <div className="modal">
                <div className="modal-box rounded-2xl">
                    <h3 className="font-bold text-lg mb-4">Create New File</h3>
                    <form onSubmit={handleCreateNewFile} className="space-y-4">
                        <div>
                            <label className="label">
                                <span className="label-text">File Path</span>
                            </label>
                            <input
                                ref={newFileInputRef}
                                type="text"
                                placeholder="e.g., src/index.ts"
                                value={newFilePath}
                                onChange={(e) => setNewFilePath(e.target.value)}
                                required
                                className="input input-bordered w-full validator"
                            />
                            <p className="validator-hint">
                                {newFilePath.trim() === '' ? 'File path is required' : ''}
                            </p>
                            <p className="text-xs text-base-content/50 mt-2">
                                Use forward slashes (/) for folders
                            </p>
                        </div>
                        <div className="modal-action">
                            <button
                                type="button"
                                className="btn btn-outline rounded-xl"
                                onClick={handleCloseNewFileModal}
                            >
                                Cancel
                            </button>
                            <button type="submit" className="btn btn-primary rounded-xl">
                                Create
                            </button>
                        </div>
                    </form>
                </div>
                <label
                    className="modal-backdrop"
                    htmlFor="new_file_modal"
                    onClick={handleCloseNewFileModal}
                />
            </div>

            {/* Suggestions Modal */}
            <SuggestionsModal
                isOpen={showSuggestionsModal}
                onClose={() => setShowSuggestionsModal(false)}
                suggestions={suggestions}
            />

            {/* Language Selector Modal */}
            <LanguageSelectorModal
                ref={languageModalRef}
                onClose={() => languageModalRef.current?.close()}
                onSelect={handleLanguageSelect}
                currentLanguage={currentFile?.language || 'javascript'}
            />

            {/* Delete Error Modal */}
            <dialog ref={deleteErrorModalRef} className="modal">
                <div className="modal-box rounded-2xl">
                    <h3 className="font-bold text-lg">Cannot Delete File</h3>
                    <p className="py-4">You cannot delete the last file. Every project must have at least one file.</p>
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-primary rounded-xl">OK</button>
                        </form>
                    </div>
                </div>
            </dialog>
        </div>
    )
}
