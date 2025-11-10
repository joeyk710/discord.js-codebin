'use client'

import React, { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import SuggestionsPanel from '@/components/SuggestionsPanel'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { analyzeDiscordJsCode, type Suggestion } from '@/lib/analyzer'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface PasteData {
  id: string
  code: string
  title: string
  description: string
  language: string
  createdAt: string
  views: number
  isPublic: boolean
}

// Helper function to check if user owns this paste
function isOwnedByUser(pasteId: string): boolean {
  if (typeof window === 'undefined') return false
  const ownedPastes = JSON.parse(localStorage.getItem('ownedPastes') || '[]')
  return ownedPastes.includes(pasteId)
}

export default function PastePage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise
  const { id } = React.use(params)
  const router = useRouter()

  const [paste, setPaste] = useState<PasteData | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [theme, setTheme] = useState<'vs-dark' | 'vs'>('vs-dark')
  const [deleting, setDeleting] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [rateLimitError, setRateLimitError] = useState('')
  const [retryAfter, setRetryAfter] = useState(0)
  const deleteModalRef = useRef<HTMLInputElement>(null)
  const rateLimitModalRef = useRef<HTMLDialogElement>(null)
  const suggestionsModalRef = useRef<HTMLInputElement>(null)

  // Detect and watch theme changes
  useEffect(() => {
    const updateTheme = () => {
      const htmlTheme = document.documentElement.getAttribute('data-theme')
      setTheme(htmlTheme === 'light' ? 'vs' : 'vs-dark')
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const fetchPaste = async () => {
      try {
        const response = await fetch(`/api/paste?id=${id}`)
        if (!response.ok) throw new Error('Paste not found')
        const data: PasteData = await response.json()
        setPaste(data)

        // Check if user owns this paste
        setIsOwner(isOwnedByUser(id))

        // Analyze the pasted code for suggestions
        try {
          const results = await analyzeDiscordJsCode(data.code)
          setSuggestions(results)

          // Enrich with documentation
          try {
            const text = results.map(r => r.message + ' ' + (r.details || '')).join('\n')
            const docsRes = await fetch('/api/docs', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text }),
            })

            if (docsRes.ok) {
              const payload = await docsRes.json()
              if (payload.ok && payload.examples) {
                const examplesMap: Record<string, any> = payload.examples
                const enriched = results.map(s => {
                  if (s.code) return s
                  const lower = (s.message + ' ' + (s.details || '')).toLowerCase()
                  for (const exKey of Object.keys(examplesMap)) {
                    const ex = examplesMap[exKey]
                    const hay = (ex.title + ' ' + ex.description + ' ' + ex.code).toLowerCase()
                    if (lower.includes(exKey) || hay.includes(lower.split(' ')[0] || '')) {
                      return { ...s, code: ex.code, docLink: ex.docLink ?? ex.url ?? null }
                    }
                  }
                  const first = examplesMap[Object.keys(examplesMap)[0]]
                  if (first) return { ...s, code: first.code, docLink: first.docLink ?? first.url ?? null }
                  return s
                })
                setSuggestions(enriched)
              }
            }
          } catch (err) {
            console.debug('Doc enrichment failed:', err)
          }
        } catch (analyzeError) {
          console.error('Error analyzing pasted code:', analyzeError)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading paste')
      } finally {
        setLoading(false)
      }
    }

    fetchPaste()
  }, [id])

  const handleCopyCode = () => {
    if (paste) {
      navigator.clipboard.writeText(paste.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDownload = () => {
    if (paste) {
      const element = document.createElement('a')
      const file = new Blob([paste.code], { type: 'text/plain' })
      element.href = URL.createObjectURL(file)
      element.download = `${paste.title || 'code'}.${paste.language === 'typescript' ? 'ts' : 'js'}`
      document.body.appendChild(element)
      element.click()
      document.body.removeChild(element)
    }
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      const response = await fetch(`/api/paste?id=${id}&token=${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        // Handle rate limit errors (429)
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get('Retry-After')
          const seconds = retryAfterHeader ? parseInt(retryAfterHeader) : 60
          setRetryAfter(seconds)
          setRateLimitError('Too many requests. Please wait before trying again.')
          if (rateLimitModalRef.current) {
            rateLimitModalRef.current.showModal()
          }
          setDeleting(false)
          return
        }
        throw new Error('Failed to delete paste')
      }

      // Redirect to home page after successful deletion
      router.push('/')
    } catch (err) {
      console.error('Error deleting paste:', err)
      setError(err instanceof Error ? err.message : 'Error deleting paste')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="loading loading-spinner loading-lg text-primary"></div>
      </div>
    )
  }

  if (error || !paste) {
    return (
      <div className="min-h-screen bg-base-100 flex flex-col items-center justify-center gap-4">
        <div className="alert alert-error max-w-md">
          <span>{error || 'Paste not found'}</span>
        </div>
        <Link href="/" className="btn rounded-xl btn-primary">
          ← Back to Editor
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base-100 flex flex-col">
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300 px-4 sm:px-6 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Back Button and Title */}
          <div className="flex items-start gap-2">
            <Link href="/" className="btn rounded-xl btn-ghost btn-sm mt-1 flex-shrink-0">
              ← Back
            </Link>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold">{paste.title}</h1>
              {paste.description && <p className="text-xs sm:text-sm opacity-75 mt-1">{paste.description}</p>}
              <div className="text-xs opacity-60 mt-1">
                {new Date(paste.createdAt).toLocaleDateString()} • {paste.views} views • {paste.language}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 flex-wrap justify-start sm:justify-end">
            <button
              onClick={handleCopyCode}
              className="btn rounded-xl btn-sm btn-outline"
              title="Copy code to clipboard"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </button>
            <button onClick={handleDownload} className="btn rounded-xl btn-sm btn-outline" title="Download as file">
              ⬇️ Download
            </button>
            <button onClick={handleShare} className="btn rounded-xl btn-sm btn-primary" title="Share this paste">
              🔗 Share
            </button>
            {isOwner && (
              <button
                onClick={() => {
                  if (deleteModalRef.current) {
                    deleteModalRef.current.checked = true
                  }
                }}
                className="btn rounded-xl btn-sm btn-error"
                title="Delete this paste"
                disabled={deleting}
              >
                🗑️ Delete
              </button>
            )}
            <ThemeSwitcher />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex gap-6 overflow-hidden p-4 sm:p-6 flex-col lg:flex-row min-h-0">
        {/* Editor - full width on mobile with fixed height, flex-1 on desktop */}
        <div className="flex-1 flex flex-col min-h-0 rounded-lg overflow-hidden border border-base-300 h-96 lg:h-auto">
          <div className="bg-base-200 px-4 py-2 font-semibold text-sm">Code</div>
          <Editor
            language={paste.language === 'typescript' ? 'typescript' : 'javascript'}
            value={paste.code}
            theme={theme}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              quickSuggestions: false,
              suggestOnTriggerCharacters: false,
              acceptSuggestionOnCommitCharacter: false,
              acceptSuggestionOnEnter: 'off',
              suggest: { shareSuggestSelections: false },
              hover: { enabled: false },
              bracketPairColorization: { enabled: true },
              guides: {
                bracketPairs: true,
                bracketPairsHorizontal: true,
                highlightActiveBracketPair: true,
              },
              matchBrackets: 'always',
              contextmenu: false,
            }}
            height="100%"
          />
        </div>

        {/* Suggestions - hidden on mobile, shown in modal */}
        <div className="hidden lg:flex w-96 flex-shrink-0 rounded-lg overflow-hidden border border-base-300 flex-col">
          <div className="bg-base-200 px-4 py-2 font-semibold text-sm">Analysis & Suggestions</div>
          <div className="flex-1 overflow-y-auto">
            {suggestions.length === 0 ? (
              <div className="p-4 text-sm text-center opacity-60">
                ✅ No issues found! Your code looks great.
              </div>
            ) : (
              <SuggestionsPanel suggestions={suggestions} />
            )}
          </div>
        </div>

        {/* Mobile Suggestions Button */}
        <div className="lg:hidden flex items-center justify-center py-4">
          <label
            htmlFor="suggestions_modal"
            className="btn btn-primary rounded-xl gap-2"
          >
            💡 Analysis & Suggestions
            {suggestions.length > 0 && (
              <span className="badge badge-secondary">{suggestions.length}</span>
            )}
          </label>
        </div>
      </div>

      {/* Mobile Suggestions Modal */}
      <input
        ref={suggestionsModalRef}
        type="checkbox"
        id="suggestions_modal"
        className="modal-toggle"
      />
      <div className="modal" role="dialog">
        <div className="modal-box rounded-xl w-11/12 max-h-96">
          <h3 className="font-bold text-lg mb-4">Analysis & Suggestions</h3>
          <div className="overflow-y-auto max-h-72">
            {suggestions.length === 0 ? (
              <div className="p-4 text-sm text-center opacity-60">
                ✅ No issues found! Your code looks great.
              </div>
            ) : (
              <SuggestionsPanel suggestions={suggestions} />
            )}
          </div>
          <div className="modal-action">
            <label htmlFor="suggestions_modal" className="btn btn-ghost rounded-xl">
              Close
            </label>
          </div>
        </div>
        <label className="modal-backdrop" htmlFor="suggestions_modal"></label>
      </div>

      {/* Footer */}
      <div className="bg-base-200 border-t border-base-300 px-6 py-4 text-center text-sm opacity-75">
        <p>
          Found an issue? Check the{' '}
          <a
            href="https://discord.js.org"
            target="_blank"
            rel="noopener noreferrer"
            className="link link-primary"
          >
            discord.js documentation
          </a>{' '}
          or{' '}
          <a href="https://discordjs.guide" target="_blank" rel="noopener noreferrer" className="link link-primary">
            discordjs.guide
          </a>
        </p>
      </div>

      {/* Delete Confirmation Modal */}
      <input
        ref={deleteModalRef}
        type="checkbox"
        id="delete_modal"
        className="modal-toggle"
      />
      <div className="modal">
        <div className="modal-box rounded-xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">🗑️</span>
            <div>
              <h3 className="font-bold text-2xl text-base-content">Delete Paste?</h3>
              <p className="text-sm text-base-content/60">This cannot be undone</p>
            </div>
          </div>

          <p className="py-4 text-base-content/70">
            Are you sure you want to permanently delete this paste? This action cannot be undone.
          </p>

          <div className="modal-action gap-3">
            <label
              htmlFor="delete_modal"
              className="btn btn-ghost rounded-xl"
              onClick={() => {
                if (deleteModalRef.current) {
                  deleteModalRef.current.checked = false
                }
              }}
            >
              Cancel
            </label>
            <button
              onClick={handleDelete}
              className="btn btn-error rounded-xl gap-2"
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Deleting...
                </>
              ) : (
                <>🗑️ Delete Paste</>
              )}
            </button>
          </div>
        </div>
        <label className="modal-backdrop" htmlFor="delete_modal" onClick={() => {
          if (deleteModalRef.current) {
            deleteModalRef.current.checked = false
          }
        }}></label>
      </div>

      {/* Rate Limit Error Modal */}
      <dialog ref={rateLimitModalRef} className="modal">
        <div className="modal-box rounded-xl max-w-md">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-4xl">⏳</span>
            <div>
              <h3 className="font-bold text-2xl text-base-content">Rate Limited</h3>
              <p className="text-sm text-base-content/60">Too many requests</p>
            </div>
          </div>

          <p className="py-4 text-base-content/70">
            You're making too many requests. Please wait {retryAfter} seconds before trying again.
          </p>

          <div className="alert alert-warning mt-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4v2m0-11a9 9 0 110 18 9 9 0 010-18z" />
            </svg>
            <span>This limit is per-user to protect the service from abuse.</span>
          </div>

          <div className="modal-action mt-6">
            <form method="dialog">
              <button className="btn btn-primary rounded-xl">Got it</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  )
}
