'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'
import CodeEditor from './CodeEditor'
// FileTabs removed — tabs UI is unused; keep sidebar only
import FileTree from './FileTree'
import LanguageSelectorModal from './LanguageSelectorModal'
import { SUPPORTED_LANGUAGES, getExtensionForLanguage } from '@/lib/languages'
import ToastContainer from './ToastContainer'
import { ToastProps } from './Toast'
import ErrorModal from './ErrorModal'
import { getMaterialIconFilename, inferLanguageFromFilename } from '@/lib/fileTree'
import { buildFileTree, FileNode } from '@/lib/fileTree'

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
    const prevInitialRef = useRef<FileData[] | null>(null)
    const lastEmittedRef = useRef<string | null>(null)

    // Helper to update files. Parent will be notified by the effect below when `files` changes.
    const updateFiles = useCallback((newFiles: FileData[] | ((prev: FileData[]) => FileData[])) => {
        setFiles(prev => (typeof newFiles === 'function' ? newFiles(prev) : newFiles))
    }, [])
    const [fileTree, setFileTree] = useState<FileNode[]>([])
    const [showNewFileDialog, setShowNewFileDialog] = useState(false)

    const [newFilePath, setNewFilePath] = useState('')
    const [newFileExtensionError, setNewFileExtensionError] = useState<string | null>(null)
    const [showDeleteErrorModal, setShowDeleteErrorModal] = useState(false)
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false)
    const [fileToDelete, setFileToDelete] = useState<string | null>(null)
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const clearDeleteTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [toasts, setToasts] = useState<ToastProps[]>([])
    const newFileInputRef = useRef<HTMLInputElement>(null)
    const newFileModalRef = useRef<HTMLInputElement>(null)
    const deleteConfirmModalRef = useRef<HTMLDialogElement>(null)
    const languageModalRef = useRef<HTMLDialogElement>(null)

    // derived new-file validation helpers
    const newFileBaseName = newFilePath.trim() ? (newFilePath.trim().split('/').pop() || '') : ''
    const newFileBaseNameIsOnlyDots = newFileBaseName !== '' && /^[.]+$/.test(newFileBaseName)

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
        try {
            // Remember the JSON we emit so we can distinguish local echoes from true parent restores
            lastEmittedRef.current = JSON.stringify(files)
        } catch (e) {
            lastEmittedRef.current = null
        }
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

    // (moved) computed extension validation will be defined after helper functions

    // Toast management
    const addToast = useCallback((message: React.ReactNode, type: ToastProps['type'] = 'info', duration = 3000) => {
        const id = `toast-${Date.now()}-${Math.random()}`
        setToasts(prev => [...prev, { id, message, type, duration, onClose: removeToast }])
    }, [])

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    // Sync when parent `initialFiles` changes (e.g., restoring a draft from UnifiedEditorPage)
    useEffect(() => {
        // On first mount, remember initial files but don't treat as a "restore" event
        if (prevInitialRef.current === null) {
            prevInitialRef.current = initialFiles
            return
        }

        try {
            const prevJson = JSON.stringify(prevInitialRef.current)
            const currJson = JSON.stringify(initialFiles)
            // If the current initialFiles matches the last set of files we emitted from this
            // component, it's just an echo of a local change (e.g., language select). Ignore it.
            if (lastEmittedRef.current && currJson === lastEmittedRef.current) {
                prevInitialRef.current = initialFiles
                return
            }
            if (prevJson !== currJson) {
                // Update editor state to reflect restored files
                setFiles(initialFiles)
                setOpenFiles(initialFiles.slice(0, 1).map(f => ({ path: f.path, name: f.name, language: f.language })))
                setActiveFile(initialFiles[0]?.path || '')
                // Notify user
                addToast('Draft restored', 'success', 3000)
                prevInitialRef.current = initialFiles
            }
        } catch (e) {
            // Fallback: if stringify fails, do a shallow compare by length
            if ((prevInitialRef.current || []).length !== initialFiles.length) {
                setFiles(initialFiles)
                setOpenFiles(initialFiles.slice(0, 1).map(f => ({ path: f.path, name: f.name, language: f.language })))
                setActiveFile(initialFiles[0]?.path || '')
                addToast('Draft restored', 'success', 3000)
                prevInitialRef.current = initialFiles
            }
        }
    }, [initialFiles, addToast])

    // Cleanup any scheduled clear timeout on unmount to avoid leaks
    useEffect(() => {
        return () => {
            if (clearDeleteTimeoutRef.current) {
                clearTimeout(clearDeleteTimeoutRef.current)
                clearDeleteTimeoutRef.current = null
            }
        }
    }, [])

    // Using shared helper `getExtensionForLanguage` from `lib/languages.ts`

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

    // Compute extension validation from the current newFilePath without setting state during render
    const computedNewFileExtensionError = (() => {
        const userPath = newFilePath.trim()
        if (!userPath) return null
        const baseName = userPath.split('/').pop() || ''
        if (!baseName) return null
        const userHasExt = baseName.includes('.')
        if (!userHasExt) return null
        const ext = baseName.split('.').pop() || ''

        // Build allowed extensions from SUPPORTED_LANGUAGES using the existing helper
        const allowedExts = SUPPORTED_LANGUAGES
            .map(l => getExtensionForLanguage(l))
            .filter(Boolean)
            .map(s => s.toLowerCase())

        // If extension matches one of the allowed extensions, accept it. Otherwise show a generic guidance message.
        return allowedExts.includes(ext.toLowerCase()) ? null : `Extension .${ext} is not supported by the available languages. Choose a language from the selector.`
    })()

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

    const handleAddFile = useCallback((folderPath?: string) => {
        // Prefill input with folder path (if provided) so new file is created in that folder
        if (folderPath && folderPath !== '.') {
            // ensure trailing slash
            const prefix = folderPath.endsWith('/') ? folderPath : `${folderPath}/`
            setNewFilePath(prefix)
        } else {
            setNewFilePath('')
        }
        setShowNewFileDialog(true)
        setTimeout(() => newFileInputRef.current?.focus(), 0)
    }, [])



    const handleCloseNewFileModal = useCallback(() => {
        setShowNewFileDialog(false)
        if (newFileModalRef.current) {
            newFileModalRef.current.checked = false
        }
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

            // Normalize path: collapse consecutive slashes, remove leading/trailing slash
            const raw = newFilePath.trim()
            let userPath = raw.replace(/\/+/g, '/').replace(/(^\/|\/$)/g, '')

            // Prevent empty path segments (consecutive slashes were removed above, but double-check)
            const segments = userPath.split('/')
            if (segments.some(s => s.trim() === '')) {
                addToast('Invalid path. Path segments cannot be empty.', 'error', 4000)
                return
            }
            const baseNameCheck = userPath.split('/').pop() || ''
            if (!baseNameCheck || /^[.]+$/.test(baseNameCheck)) {
                addToast(
                    <>
                        Invalid filename: <strong>{baseNameCheck || userPath}</strong>. Filenames cannot be empty or consist only of dots.
                    </>,
                    'error',
                    4000
                )
                return
            }
            const parts = userPath.split('/')
            let filenameCandidate = parts[parts.length - 1] || ''
            let folderParts = parts.slice(0, -1)

            // Prevent creating more than one new folder in a single file creation.
            // Build set of existing folder paths from current files.
            const existingFolders = new Set<string>()
            for (const f of files) {
                const p = f.path.split('/')
                let curr = ''
                for (let i = 0; i < p.length - 1; i++) {
                    curr = curr ? `${curr}/${p[i]}` : p[i]
                    existingFolders.add(curr)
                }
            }

            // Count how many cumulative folder segments in the requested path do not exist yet.
            if (folderParts.length > 0) {
                let cum = ''
                let missing = 0
                for (let i = 0; i < folderParts.length; i++) {
                    cum = cum ? `${cum}/${folderParts[i]}` : folderParts[i]
                    if (!existingFolders.has(cum)) missing++
                }

                if (missing > 1) {
                    addToast(
                        'Please create folders one at a time. Create the parent folder first, then add nested folders or files.',
                        'error',
                        5000
                    )
                    return
                }
            }

            // If user attempted to create more than 2 folder segments, clamp to two and notify.
            if (folderParts.length > 2) {
                const allowed = folderParts.slice(0, 2)
                const newDir = allowed.join('/')
                addToast(
                    `Paths deeper than 2 folders are not supported. File will be created in ${newDir}/`,
                    'warning',
                    5000
                )
                // Move filename into the second folder
                filenameCandidate = filenameCandidate || 'index'
                // Reconstruct userPath limited to two folders
                const clampedUserPath = `${newDir}/${filenameCandidate}`
                userPath = clampedUserPath
                folderParts = allowed
            }

            const userHasExt = (filenameCandidate || '').includes('.')
            // If user provided an explicit extension, validate it against allowed languages
            if (userHasExt) {
                const ext = (filenameCandidate || '').split('.').pop() || ''
                const allowedExts = SUPPORTED_LANGUAGES.map(l => getExtensionForLanguage(l)).filter(Boolean).map(s => s.toLowerCase())
                if (!allowedExts.includes(ext.toLowerCase())) {
                    setNewFileExtensionError(`Extension .${ext} is not supported by the available languages. Choose a language from the selector.`)
                    return
                }
            }
            // Use current file's language as default, or fallback to javascript
            const defaultLang = currentFile?.language || 'javascript'
            const pathWithExt = userHasExt ? userPath : getPathWithExtension(userPath, defaultLang)

            const uniquePath = generateUniquePath(pathWithExt, defaultLang)

            if (uniquePath.toLowerCase() !== pathWithExt.toLowerCase()) {
                // Show non-blocking toast instead of alert
                addToast(
                    <>
                        File renamed to <strong>{uniquePath.split('/').pop()}</strong> to avoid duplicate
                    </>,
                    'warning',
                    4000
                )
            }

            const fileName = uniquePath.split('/').pop() || uniquePath
            // Ensure we actually have a filename
            if (!fileName) {
                addToast('Invalid path. A filename is required.', 'error', 4000)
                return
            }
            if (fileName.length > 50) {
                addToast(
                    <>
                        Filename too long: <strong>{fileName}</strong> ({fileName.length}/50)
                    </>,
                    'error',
                    4000
                )
                return
            }
            const inferredLang = inferLanguageFromFilename(fileName) || defaultLang

            const newFile: FileData = {
                id: `file-${Date.now()}`,
                path: uniquePath,
                name: fileName,
                code: '',
                language: inferredLang,
            }

            // Clear any extension error on successful create
            setNewFileExtensionError(null)

            updateFiles(prev => [...prev, newFile])
            // Immediately set active/open state using the new file object (avoid relying on async state update)
            setActiveFile(newFile.path)
            setOpenFiles(prev => [...prev, { path: newFile.path, name: newFile.name, language: newFile.language }])
            handleCloseNewFileModal()
            // Clear the input after successfully creating the file
            setNewFilePath('')
            addToast(
                <>
                    Created <strong>{fileName}</strong>
                </>,
                'success',
                2000
            )
        },
        [files, newFilePath, currentFile, handleFileSelect, addToast]
    )

    const handleDeleteFile = useCallback(
        (path: string) => {
            if (files.length <= 1) {
                setShowDeleteErrorModal(true)
                return
            }

            // Show confirmation modal
            // Clear any previously scheduled clear (we're opening a modal now)
            if (clearDeleteTimeoutRef.current) {
                clearTimeout(clearDeleteTimeoutRef.current)
                clearDeleteTimeoutRef.current = null
            }
            setFileToDelete(path)
            setIsDeleteModalOpen(true)
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
        // Close modal visually first, then clear the `fileToDelete` after the modal close animation
        setShowDeleteConfirmModal(false)
        setIsDeleteModalOpen(false)
        if (deleteConfirmModalRef.current) {
            deleteConfirmModalRef.current.close()
        }
        // Schedule clearing the filename after a short delay so the modal close animation can finish
        if (clearDeleteTimeoutRef.current) clearTimeout(clearDeleteTimeoutRef.current)
        clearDeleteTimeoutRef.current = setTimeout(() => {
            setFileToDelete(null)
            clearDeleteTimeoutRef.current = null
        }, 220)
        addToast(
            <>
                Deleted <strong>{fileName}</strong>
            </>,
            'info',
            2500
        )
    }, [files, fileToDelete, handleTabClose, addToast])

    const handleCancelDelete = useCallback(() => {
        // Close modal visually first, then clear the `fileToDelete` after close animation
        setShowDeleteConfirmModal(false)
        setIsDeleteModalOpen(false)

        if (deleteConfirmModalRef.current) {
            deleteConfirmModalRef.current.close()
        }

        if (clearDeleteTimeoutRef.current) clearTimeout(clearDeleteTimeoutRef.current)
        clearDeleteTimeoutRef.current = setTimeout(() => {
            setFileToDelete(null)
            clearDeleteTimeoutRef.current = null
        }, 220)
    }, [])

    const handleRenameFile = useCallback(
        (oldPath: string, newPath: string) => {
            // Infer language from new filename extension and avoid collisions with other files
            const newNameCandidate = newPath.split('/').pop() || newPath
            const oldName = oldPath.split('/').pop() || oldPath

            // If the user provided an explicit extension in the new name, validate it against supported languages
            const newHasExt = newNameCandidate.includes('.')
            if (newHasExt) {
                const ext = newNameCandidate.split('.').pop() || ''
                const allowedExts = SUPPORTED_LANGUAGES.map(l => getExtensionForLanguage(l)).filter(Boolean).map(s => s.toLowerCase())
                if (!allowedExts.includes(ext.toLowerCase())) {
                    addToast(`Extension .${ext} is not supported by the available languages. Choose a language from the selector.`, 'error', 4000)
                    return
                }
            }

            // Other files (exclude the file we're renaming) to check for collisions
            const otherFiles = files.filter(f => f.path !== oldPath)

            const makeUniqueAmong = (basePath: string, language?: string) => {
                const dirIndex = basePath.lastIndexOf('/')
                const dir = dirIndex > -1 ? basePath.substring(0, dirIndex + 1) : ''
                const filename = dirIndex > -1 ? basePath.substring(dirIndex + 1) : basePath
                const hasDot = filename.includes('.')
                const nameWithoutExt = hasDot ? filename.substring(0, filename.lastIndexOf('.')) : filename
                const ext = hasDot ? filename.substring(filename.lastIndexOf('.') + 1) : (getExtensionForLanguage(language || 'javascript') || '')

                let candidate = ext ? `${dir}${nameWithoutExt}.${ext}` : `${dir}${nameWithoutExt}`
                let i = 1
                const lowerExists = (p: string) => otherFiles.some(of => of.path.toLowerCase() === p.toLowerCase())
                while (lowerExists(candidate)) {
                    candidate = ext ? `${dir}${nameWithoutExt}(${i}).${ext}` : `${dir}${nameWithoutExt}(${i})`
                    i++
                }
                return candidate
            }

            const inferredLangCandidate = inferLanguageFromFilename(newNameCandidate) || undefined
            const finalPath = makeUniqueAmong(newPath, inferredLangCandidate ?? undefined)
            const finalName = finalPath.split('/').pop() || finalPath
            const inferredLang = inferLanguageFromFilename(finalName) || inferredLangCandidate

            updateFiles(files.map(f =>
                f.path === oldPath
                    ? {
                        ...f,
                        path: finalPath,
                        name: finalName,
                        language: inferredLang ?? f.language,
                    }
                    : f
            ))

            // Update active file path if renaming the active file
            if (activeFile === oldPath) {
                setActiveFile(finalPath)
            }

            // Update open files (also carry language change)
            setOpenFiles(openFiles.map(f =>
                f.path === oldPath
                    ? { ...f, path: finalPath, name: finalName, language: inferredLang ?? f.language }
                    : f
            ))

            // Notify user: warn if we adjusted name to avoid collision, otherwise show success
            if (finalPath.toLowerCase() !== newPath.toLowerCase()) {
                addToast(
                    <>
                        File renamed to <strong>{finalName}</strong> to avoid duplicate
                    </>,
                    'warning',
                    3500
                )
            } else {
                addToast(
                    <>
                        Renamed <strong>{oldName}</strong> to <strong>{finalName}</strong>
                    </>,
                    'success',
                    3000
                )
            }
        },
        [files, activeFile, openFiles, addToast]
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
                                                <div className="tooltip tooltip-bottom" data-tip="Unsaved changes">
                                                    <span className="w-2 h-2 rounded-full bg-warning" aria-label="Unsaved changes"></span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Move controls closer to the filename so they're easier to reach */}
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => languageModalRef.current?.showModal()}
                                                className="btn btn-ori"
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
                    <div className="w-64 bg-base-100 border-r-2 border-base-300/50 dark:border-white/5 flex flex-col h-screen overflow-y-auto overflow-visible">
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
                <div className="w-64 min-w-64 border-r-2 border-base-300/50 dark:border-white/5 bg-base-100 overflow-visible">
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
                                        <div className="tooltip tooltip-bottom" data-tip="Unsaved changes">
                                            <span className="w-2 h-2 rounded-full bg-warning" aria-label="Unsaved changes"></span>
                                        </div>
                                    )}

                                    {/* Controls moved next to the filename for easier reach */}
                                    <div className="ml-3 flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => languageModalRef.current?.showModal()}
                                            className="btn btn-xs sm:btn-sm rounded-xl gap-2 sm:gap-3 h-auto p-2 sm:p-3 flex-col sm:flex-row"
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
                                onChange={(e) => {
                                    // Clear any prior extension validation error when user edits
                                    setNewFileExtensionError(null)
                                    // enforce overall path length but particularly filename length limit
                                    setNewFilePath(e.target.value.slice(0, 3000))
                                }}
                                required
                                className="input input-bordered w-full focus:input-primary validator"
                                maxLength={3000}
                            />
                            <div className="flex items-center justify-between mt-2">
                                <p className="validator-hint text-xs text-base-content/60">Filename max 50 characters</p>
                                <span className="text-xs text-base-content/60 ml-3">{newFileBaseName.length}/50</span>
                            </div>

                            {/* Preview of normalized filename */}
                            {newFilePath.trim() && (() => {
                                const userPath = newFilePath.trim()
                                const baseName = userPath.split('/').pop() || ''
                                if (!baseName || /^[.]+$/.test(baseName)) {
                                    return (
                                        <div className="mt-3 p-3 bg-error/10 border border-error/30 rounded-lg">
                                            <p className="text-sm text-error">Invalid filename: <span className="font-mono font-semibold">{baseName || userPath}</span>. Filenames cannot be empty or consist only of dots.</p>
                                        </div>
                                    )
                                }
                                const userHasExt = (userPath.split('/').pop() || '').includes('.')
                                const defaultLang = currentFile?.language || 'javascript'
                                const normalizedPath = userHasExt ? userPath : getPathWithExtension(userPath, defaultLang)
                                const willBeRenamed = doesFileExistWithLang(newFilePath, undefined)

                                // Determine extension error from computed value (avoid updating state during render)
                                const extErrorLocal = computedNewFileExtensionError

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

                                // Filename length preview (enforce 50 chars)
                                const previewFilename = (normalizedPath.split('/').pop() || '')
                                if (previewFilename.length > 50) {
                                    return (
                                        <div className="mt-3 p-3 bg-error/10 border border-error/30 rounded-lg">
                                            <p className="text-sm text-error">Filename is too long ({previewFilename.length}/50). Shorten the name to continue.</p>
                                        </div>
                                    )
                                }
                                // Show explicit extension validation error (if any)
                                if (extErrorLocal || newFileExtensionError) {
                                    return (
                                        <div className="mt-3 p-3 bg-error/10 border border-error/30 rounded-lg">
                                            <p className="text-sm text-error">{extErrorLocal ?? newFileExtensionError}</p>
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
                                disabled={newFilePath.trim() === '' || newFileBaseNameIsOnlyDots || newFileBaseName.length > 50 || !!newFileExtensionError || !!computedNewFileExtensionError}
                                className="btn btn-primary rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                                title={newFileBaseName.length > 50 ? 'Filename too long' : undefined}
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
                            className="btn btn-error text-gray-200 rounded-xl gap-2"
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

            {/* Toast container (render toasts added via `addToast`) */}
            <ToastContainer toasts={toasts} onClose={removeToast} />

        </div>
    )
}          