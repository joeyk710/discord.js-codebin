'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import CodeEditor from './CodeEditor'
// FileTabs removed — tabs UI is unused; keep sidebar only
import FileTree from './FileTree'
import SuggestionsModal from './SuggestionsModal'
import LanguageSelectorModal from './LanguageSelectorModal'
import ToastContainer from './ToastContainer'
import { ToastProps } from './Toast'
import { getMaterialIconFilename, inferLanguageFromFilename } from '@/lib/fileTree'
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

// Map internal language keys to user-facing labels
const formatLanguageDisplay = (lang: string) => {
    const key = (lang || '').toLowerCase()
    switch (key) {
        case 'javascript':
            return 'JavaScript'
        case 'typescript':
            return 'TypeScript'
        case 'json':
            return 'JSON'
        case 'python':
            return 'Python'
        case 'html':
            return 'HTML'
        case 'css':
            return 'CSS'
        case 'markdown':
            return 'Markdown'
        default:
            // Fallback: capitalize first letter
            return lang.charAt(0).toUpperCase() + lang.slice(1)
    }
}

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

    // Helper to update files. Parent will be notified by the effect below when `files` changes.
    const updateFiles = useCallback((newFiles: FileData[] | ((prev: FileData[]) => FileData[])) => {
        setFiles(prev => (typeof newFiles === 'function' ? newFiles(prev) : newFiles))
    }, [])
    const [fileTree, setFileTree] = useState<FileNode[]>([])
    const [showNewFileDialog, setShowNewFileDialog] = useState(false)
    const [newFilePath, setNewFilePath] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)
    const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false)
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
    const [fileToDelete, setFileToDelete] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [toasts, setToasts] = useState<ToastProps[]>([])
    const newFileInputRef = useRef<HTMLInputElement>(null)
    const newFileModalRef = useRef<HTMLInputElement>(null)
    const deleteErrorModalRef = useRef<HTMLDialogElement>(null)
    const deleteConfirmModalRef = useRef<HTMLDialogElement>(null)
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

    // Toast management
    const addToast = useCallback((message: string, type: ToastProps['type'] = 'info', duration = 3000) => {
        const id = `toast-${Date.now()}-${Math.random()}`
        setToasts(prev => [...prev, { id, message, type, duration, onClose: removeToast }])
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

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

            updateFiles(files.map(f =>
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
        [files, activeFile, openFiles, isReadOnly, updateFiles]
    )

    const handleAddFile = useCallback(() => {
        // Clear previous input so the modal opens with an empty field
        setNewFilePath('')
        setShowNewFileDialog(true)
        setTimeout(() => newFileInputRef.current?.focus(), 0)
    }, [])

    const handleCloseNewFileModal = useCallback(() => {
        setShowNewFileDialog(false)
        if (newFileModalRef.current) {
            newFileModalRef.current.checked = false
        }
        // Reset the input when closing to avoid keeping stale text
        setNewFilePath('')
    }, [])

    const isValidFilePath = (path: string): boolean => {
        if (!path.trim()) return false
        const fileName = path.split('/').pop() || path
        // Check if filename has an extension (contains a dot after the last slash)
        return fileName.includes('.')
    }

    const doesFileExist = (path: string): boolean => {
        const normalized = path.trim()
        return files.some(f => f.path.toLowerCase() === normalized.toLowerCase())
    }

    const doesFileExistWithLang = (path: string, language?: string): boolean => {
        // Normalize final path: if path already has extension, use it; otherwise add extension for language
        const hasExt = (p: string) => p.split('/').pop()?.includes('.')
        const normalized = hasExt(path) ? path.trim() : getPathWithExtension(path.trim(), language || 'javascript')
        return files.some(f => f.path.toLowerCase() === normalized.toLowerCase())
    }

    const generateUniquePath = (basePath: string, language?: string): string => {
        const dirIndex = basePath.lastIndexOf('/')
        const dir = dirIndex > -1 ? basePath.substring(0, dirIndex + 1) : ''
        const filename = dirIndex > -1 ? basePath.substring(dirIndex + 1) : basePath
        const hasDot = filename.includes('.')
        const nameWithoutExt = hasDot ? filename.substring(0, filename.lastIndexOf('.')) : filename
        const ext = hasDot ? filename.substring(filename.lastIndexOf('.') + 1) : (getExtensionForLanguage(language || 'javascript') || '')

        let candidate = ext ? `${dir}${nameWithoutExt}.${ext}` : `${dir}${nameWithoutExt}`
        let i = 1
        while (files.some(f => f.path.toLowerCase() === candidate.toLowerCase())) {
            candidate = ext ? `${dir}${nameWithoutExt}(${i}).${ext}` : `${dir}${nameWithoutExt}(${i})`
            i++
        }
        return candidate
    }

    const handleCreateNewFile = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault()

            if (!newFilePath.trim()) return

            const userPath = newFilePath.trim()
            const userHasExt = (userPath.split('/').pop() || '').includes('.')
            // Use current file's language as default, or fallback to javascript
            const defaultLang = currentFile?.language || 'javascript'
            const pathWithExt = userHasExt ? userPath : getPathWithExtension(userPath, defaultLang)

            const uniquePath = generateUniquePath(pathWithExt, defaultLang)

            if (uniquePath.toLowerCase() !== pathWithExt.toLowerCase()) {
                // Show non-blocking toast instead of alert
                addToast(`File renamed to ${uniquePath.split('/').pop()} to avoid duplicate`, 'warning', 4000)
            }

            const fileName = uniquePath.split('/').pop() || uniquePath
            const inferredLang = inferLanguageFromFilename(fileName) || defaultLang

            const newFile: FileData = {
                id: `file-${Date.now()}`,
                path: uniquePath,
                name: fileName,
                code: '',
                language: inferredLang,
            }

            updateFiles(prev => [...prev, newFile])
            handleFileSelect(newFile.path)
            handleCloseNewFileModal()
            addToast(`Created ${fileName}`, 'success', 2000)
        },
        [files, newFilePath, currentFile, handleFileSelect, addToast]
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

            // Show confirmation modal
            setFileToDelete(path)
            setShowDeleteConfirmModal(true)
            setTimeout(() => {
                if (deleteConfirmModalRef.current) {
                    deleteConfirmModalRef.current.showModal()
                }
            }, 0)
        },
        [files.length]
    )

    const handleConfirmDelete = useCallback(() => {
        if (!fileToDelete) return

        const fileName = fileToDelete.split('/').pop() || fileToDelete
        updateFiles(files.filter(f => f.path !== fileToDelete))
        handleTabClose(fileToDelete)
        setFileToDelete(null)
        setShowDeleteConfirmModal(false)
        if (deleteConfirmModalRef.current) {
            deleteConfirmModalRef.current.close()
        }
        addToast(`Deleted ${fileName}`, 'info', 2500)
    }, [files, fileToDelete, handleTabClose, addToast])

    const handleCancelDelete = useCallback(() => {
        setFileToDelete(null)
        setShowDeleteConfirmModal(false)
        if (deleteConfirmModalRef.current) {
            deleteConfirmModalRef.current.close()
        }
    }, [])

    const handleRenameFile = useCallback(
        (oldPath: string, newPath: string) => {
            // Infer language from new filename extension
            const newName = newPath.split('/').pop() || newPath
            const inferredLang = inferLanguageFromFilename(newName) || undefined

            updateFiles(files.map(f =>
                f.path === oldPath
                    ? {
                        ...f,
                        path: newPath,
                        name: newName,
                        language: inferredLang ?? f.language,
                    }
                    : f
            ))

            // Update active file path if renaming the active file
            if (activeFile === oldPath) {
                setActiveFile(newPath)
            }

            // Update open files (also carry language change)
            setOpenFiles(openFiles.map(f =>
                f.path === oldPath
                    ? { ...f, path: newPath, name: newName, language: inferredLang ?? f.language }
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
            updateFiles(updatedFiles)

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
        <div className="flex flex-col h-full w-full bg-base-100">
            {/* File tabs removed to keep only the sidebar; open files bar intentionally hidden */}

            {/* Drawer wrapper - mobile only */}
            <div className="drawer md:hidden flex-1 overflow-visible">
                <input id="file-drawer" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content flex flex-1 overflow-visible flex-col">
                    {/* Editor */}
                    <div className="flex-1 flex flex-col overflow-hidden w-full">
                        {currentFile ? (
                            <>
                                <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-base-200/80 backdrop-blur-sm border-b border-base-300/50 flex items-center justify-between gap-3 sm:gap-4 flex-wrap shadow-sm overflow-visible">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <label htmlFor="file-drawer" className="btn btn-ghost btn-sm btn-circle md:hidden flex items-center justify-center cursor-pointer hover:bg-base-300">
                                            <Bars3Icon className="w-5 h-5" />
                                        </label>
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <span className="text-xs sm:text-sm font-medium text-base-content/80 truncate">
                                                {currentFile.path}
                                            </span>
                                            {openFiles.find(f => f.path === currentFile.path)?.isDirty && (
                                                <span className="tooltip w-2 h-2 rounded-full bg-warning" data-tip="Unsaved changes"></span>
                                            )}
                                        </div>

                                        {/* Move controls closer to the filename so they're easier to reach */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => setShowSuggestionsModal(true)}
                                                disabled={isAnalyzing || suggestions.length === 0}
                                                className="tooltip btn btn-ghost btn-xs px-3 py-2 min-h-[40px] rounded-xl gap-2 border border-base-300/60 dark:border-white/20 bg-base-200/80 dark:bg-transparent hover:border-base-400 dark:hover:border-white/30 hover:bg-base-200/90 transition-colors"
                                                data-tip="View code suggestions"
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
                                                className="btn btn-ghost btn-xs px-3 py-2 min-h-[40px] rounded-xl gap-2 border border-base-300 dark:border-white/20 hover:border-base-400 dark:hover:border-white/30 hover:bg-base-200/40 transition-colors"
                                                aria-label={`Select language (${currentFile.language})`}
                                                disabled={isReadOnly}
                                            >
                                                {(() => {
                                                    const mapped = getMaterialIconFilename(currentFile.language) || null
                                                    if (mapped) {
                                                        return (
                                                            <img src={`/material-icons/${mapped}.svg`} alt={currentFile.language} className="w-5 h-5 mr-1" />
                                                        )
                                                    }
                                                    return (
                                                        <span className="w-5 h-5 inline-flex items-center justify-center mr-1">🔤</span>
                                                    )
                                                })()}

                                                <span className="hidden sm:inline">{formatLanguageDisplay(currentFile.language)}</span>
                                                <span className="sm:hidden ml-1 whitespace-nowrap">{formatLanguageDisplay(currentFile.language)}</span>
                                            </button>
                                        </div>
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
                            <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
                                <svg className="w-16 h-16 text-base-content/10 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <p className="text-base-content/40 text-sm font-medium mb-1">No file selected</p>
                                <p className="text-base-content/30 text-xs">Select a file from the explorer to start editing</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Drawer sidebar - mobile only */}
                <div className="drawer-side md:hidden">
                    <label htmlFor="file-drawer" className="drawer-overlay"></label>
                    <div className="w-64 bg-base-100 border-r border-base-300 flex flex-col h-screen overflow-y-auto overflow-visible">
                        <FileTree
                            files={fileTree}
                            activeFile={activeFile}
                            onFileSelect={handleFileSelect}
                            onAddFile={handleAddFile}
                            onDeleteFile={handleDeleteFile}
                            onRenameFile={handleRenameFile}
                            isReadOnly={isReadOnly}
                            openFiles={openFiles.map(f => f.path)}
                        />
                    </div>
                </div>
            </div>

            {/* Desktop sidebar + Editor layout */}
            <div className="hidden md:flex flex-1 overflow-visible">
                {/* File Tree Sidebar - desktop only */}
                <div className="w-64 min-w-64 border-r border-base-300/50 bg-base-100 overflow-visible">
                    <FileTree
                        files={fileTree}
                        activeFile={activeFile}
                        onFileSelect={handleFileSelect}
                        onAddFile={handleAddFile}
                        onDeleteFile={handleDeleteFile}
                        onRenameFile={handleRenameFile}
                        isReadOnly={isReadOnly}
                        openFiles={openFiles.map(f => f.path)}
                    />
                </div>

                {/* Editor */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {currentFile ? (
                        <>
                            <div className="px-3 sm:px-4 py-2.5 sm:py-3 bg-base-200/80 backdrop-blur-sm border-b border-base-300/50 flex items-center justify-between gap-3 sm:gap-4 flex-wrap shadow-sm overflow-visible">
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                    <span className="text-xs sm:text-sm font-medium text-base-content/80 truncate">
                                        {currentFile.path}
                                    </span>
                                    {openFiles.find(f => f.path === currentFile.path)?.isDirty && (
                                        <span className="tooltip w-2 h-2 rounded-full bg-warning" data-tip="Unsaved changes"></span>
                                    )}

                                    {/* Controls moved next to the filename for easier reach */}
                                    <div className="ml-3 flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => setShowSuggestionsModal(true)}
                                            disabled={isAnalyzing || suggestions.length === 0}
                                            className="tooltip btn btn-xs sm:btn-sm btn-outline rounded-xl gap-1.5 sm:gap-2 hover:btn-info transition-colors"
                                            data-tip="View code suggestions"
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
                                            className="btn btn-ghost btn-xs px-3 py-2 min-h-[40px] rounded-xl gap-2 border border-base-300/60 dark:border-white/20 bg-base-200/80 dark:bg-transparent hover:border-base-400 dark:hover:border-white/30 hover:bg-base-200/90 transition-colors"
                                            aria-label={`Select language (${currentFile.language})`}
                                            disabled={isReadOnly}
                                        >
                                            {(() => {
                                                const mapped = getMaterialIconFilename(currentFile.language) || null
                                                if (mapped) {
                                                    return (
                                                        <img src={`/material-icons/${mapped}.svg`} alt={currentFile.language} className="w-5 h-5 mr-1" />
                                                    )
                                                }
                                                return (
                                                    <span className="w-5 h-5 inline-flex items-center justify-center mr-1">🔤</span>
                                                )
                                            })()}

                                            <span className="hidden sm:inline">{formatLanguageDisplay(currentFile.language)}</span>
                                            <span className="sm:hidden whitespace-nowrap">{formatLanguageDisplay(currentFile.language)}</span>
                                        </button>
                                    </div>
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
                        <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
                            <svg className="w-16 h-16 text-base-content/10 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-base-content/40 text-sm font-medium mb-1">No file selected</p>
                            <p className="text-base-content/30 text-xs">Select a file from the explorer to start editing</p>
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
                <div className="modal-box rounded-2xl max-w-lg">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="font-bold text-lg">Create New File</h3>
                    </div>
                    <form onSubmit={handleCreateNewFile} className="space-y-5">
                        <div>
                            <label className="label">
                                <span className="label-text font-medium">File Path</span>
                            </label>
                            <input
                                ref={newFileInputRef}
                                type="text"
                                placeholder="e.g., src/index or src/index.ts"
                                value={newFilePath}
                                onChange={(e) => setNewFilePath(e.target.value)}
                                required
                                className="input input-bordered w-full focus:input-primary"
                            />

                            {/* Preview of normalized filename */}
                            {newFilePath.trim() && (() => {
                                const userPath = newFilePath.trim()
                                const userHasExt = (userPath.split('/').pop() || '').includes('.')
                                const defaultLang = currentFile?.language || 'javascript'
                                const normalizedPath = userHasExt ? userPath : getPathWithExtension(userPath, defaultLang)
                                const willBeRenamed = doesFileExistWithLang(newFilePath, undefined)

                                if (willBeRenamed) {
                                    const uniquePath = generateUniquePath(normalizedPath, defaultLang)
                                    return (
                                        <div className="mt-3 p-3 bg-warning/10 border border-warning/30 rounded-lg">
                                            <p className="text-sm text-warning flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                </svg>
                                                File exists, will create: <span className="font-mono font-semibold">{uniquePath}</span>
                                            </p>
                                        </div>
                                    )
                                }

                                if (!userHasExt) {
                                    return (
                                        <div className="mt-3 p-3 bg-info/10 border border-info/30 rounded-lg">
                                            <p className="text-sm text-info flex items-center gap-2">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Will create: <span className="font-mono font-semibold">{normalizedPath}</span>
                                            </p>
                                        </div>
                                    )
                                }

                                return null
                            })()}

                            <p className="text-xs text-base-content/60 mt-3">
                                Extension will be inferred from filename or use <span className="font-mono">.{getExtensionForLanguage(currentFile?.language || 'javascript')}</span> (current language)
                            </p>
                        </div>
                        <div className="modal-action mt-6">
                            <button
                                type="button"
                                className="btn btn-ghost rounded-xl"
                                onClick={handleCloseNewFileModal}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={newFilePath.trim() === ''}
                                className="btn btn-primary rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Create File
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

            {/* Delete Confirmation Modal */}
            <dialog ref={deleteConfirmModalRef} className="modal">
                <div className="modal-box rounded-2xl max-w-md">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                            <svg className="w-6 h-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2">Delete File?</h3>
                            <p className="text-sm text-base-content/70">
                                Are you sure you want to delete{' '}
                                <span className="font-semibold text-base-content">{fileToDelete?.split('/').pop()}</span>?
                                {' '}This action cannot be undone.
                            </p>
                        </div>
                    </div>
                    <div className="modal-action mt-6">
                        <button
                            type="button"
                            className="btn btn-ghost rounded-xl"
                            onClick={handleCancelDelete}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-error rounded-xl gap-2"
                            onClick={handleConfirmDelete}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete File
                        </button>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={handleCancelDelete}>close</button>
                </form>
            </dialog>

            {/* Delete Error Modal */}
            <dialog ref={deleteErrorModalRef} className="modal">
                <div className="modal-box rounded-2xl max-w-md">
                    <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                            <svg className="w-6 h-6 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-2">Cannot Delete File</h3>
                            <p className="text-sm text-base-content/70">
                                You cannot delete the last file. Every project must have at least one file.
                            </p>
                        </div>
                    </div>
                    <div className="modal-action mt-6">
                        <form method="dialog">
                            <button className="btn btn-primary rounded-xl">Got it</button>
                        </form>
                    </div>
                </div>
            </dialog>

            {/* Toast Notifications */}
            <ToastContainer toasts={toasts} onClose={removeToast} />
        </div>
    )
}
