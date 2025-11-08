'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import Navbar from './Navbar'
import CodeEditor from './CodeEditor'
import SuggestionsModal from './SuggestionsModal'
import SaveModal from './SaveModal'
import ShareModal from './ShareModal'
import ThemeSwitcher from './ThemeSwitcher'
import Footer from './Footer'
import { analyzeDiscordJsCode, type Suggestion } from '@/lib/analyzer'

const INITIAL_CODE = `import { Client, Events, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once(Events.ClientReady, () => {
  console.log('Bot is online!');
});

client.login(DISCORD_TOKEN);
`

export default function EditorPage() {
  const [code, setCode] = useState(INITIAL_CODE)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [showMetadata, setShowMetadata] = useState(false)
  const [language, setLanguage] = useState<'javascript' | 'typescript' | 'json'>('javascript')
  const [isPublic, setIsPublic] = useState(true)
  const [isDesktop, setIsDesktop] = useState(false)
  const confirmModalRef = useRef<HTMLInputElement>(null)

  // Initialize desktop state after hydration
  useEffect(() => {
    setIsDesktop(window.innerWidth >= 640)
    const handleResize = () => setIsDesktop(window.innerWidth >= 640)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Analyze code with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const results = analyzeDiscordJsCode(code)
        setSuggestions(results)

        try {
          const text = results.map(r => r.message + ' ' + (r.details || '')).join('\n')
          const res = await fetch('/api/docs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          })

          if (res.ok) {
            const payload = await res.json()
            if (payload.ok && payload.examples) {
              const examplesMap = payload.examples
              const enriched = results.map((s: Suggestion) => {
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
      } catch (error) {
        console.error('Error analyzing code:', error)
        setSuggestions([])
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [code])

  const handleCodeChange = useCallback((newCode: string) => {
    setCode(newCode)
  }, [])

  // Control confirmation modal
  useEffect(() => {
    if (confirmModalRef.current) {
      confirmModalRef.current.checked = showConfirmModal
    }
  }, [showConfirmModal])

  const handleSaveWithMetadata = async (metadata: any) => {
    setIsSaving(true)
    setShowSaveModal(false)
    try {
      const response = await fetch('/api/paste', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          title: title || 'Untitled',
          description: description || '',
          language,
          isPublic: metadata.isPublic,
        }),
      })
      const data = await response.json()

      if (data.id) {
        const url = data.shortUrl || `${window.location.origin}/paste/${data.id}`
        setShareUrl(url)
        setIsPublic(metadata.isPublic)
        setShowShareModal(true)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNew = () => {
    setShowConfirmModal(true)
  }

  const handleConfirmNew = () => {
    setShowConfirmModal(false)
    setCode(INITIAL_CODE)
    setShareUrl('')
  }

  return (
    <div className="flex flex-col h-screen bg-base-100 m-1 sm:m-3 rounded-2xl shadow-xl overflow-hidden">
      <Navbar
        onNew={handleNew}
        onSaveShare={() => setShowSaveModal(true)}
        isSaving={isSaving}
      />

      <main className="w-full px-2 sm:px-3 py-2 sm:py-4 flex-1 flex flex-col gap-2 sm:gap-4 overflow-hidden min-h-0">
        {/* Top Row: Action Buttons + Language/Tips (Left) */}
        <div className="flex gap-1 sm:gap-2 flex-wrap items-center">
          <button
            onClick={handleNew}
            className="btn btn-xs sm:btn-sm btn-ghost rounded-lg"
            title="Create new code snippet"
          >
            <span className="hidden sm:inline">➕ New</span>
            <span className="sm:hidden">➕</span>
          </button>
          <button
            onClick={() => setShowSaveModal(true)}
            disabled={isSaving}
            className="btn btn-xs sm:btn-sm btn-primary rounded-lg"
            title="Save and share your code"
          >
            <span className="hidden sm:inline">{isSaving ? '⏳ Saving...' : '💾 Save & Share'}</span>
            <span className="sm:hidden">{isSaving ? '⏳' : '💾'}</span>
          </button>
          <ThemeSwitcher />

          {/* Language Selector */}
          <div className="dropdown">
            <button tabIndex={0} className="btn btn-xs rounded-lg gap-1">
              {language === 'javascript' && '📜 JS'}
              {language === 'typescript' && '🔷 TS'}
              {language === 'json' && '📋 JSON'}
            </button>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-50 w-48 sm:w-52 p-2 shadow border border-base-300">
              <li><a onClick={() => setLanguage('javascript')}>📜 JavaScript</a></li>
              <li><a onClick={() => setLanguage('typescript')}>🔷 TypeScript</a></li>
              <li><a onClick={() => setLanguage('json')}>📋 JSON</a></li>
            </ul>
          </div>
          <button
            onClick={() => setShowSuggestionsModal(true)}
            className="btn btn-xs rounded-lg gap-1"
            title="View tips and suggestions"
          >
            💡 Tips
          </button>
        </div>

        {/* Code Editor - Full Width */}
        <div className="flex-1 flex flex-col rounded-xl overflow-hidden border border-base-300 shadow-lg bg-base-100 min-h-64 w-full">
          <div className="bg-base-200 px-3 sm:px-6 py-2 sm:py-3 border-b border-base-300 flex items-center gap-2 sm:gap-3 flex-shrink-0 flex-wrap">
            <span className="text-lg sm:text-2xl flex-shrink-0">📝</span>
            <span className="text-xs sm:text-sm font-medium text-base-content flex-shrink-0">
              {code.split('\n').length} {code.split('\n').length === 1 ? 'line' : 'lines'}
            </span>
            <input
              type="text"
              placeholder="Snippet name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input input-xs sm:input-sm input-bordered rounded h-8 flex-1 min-w-32 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="text"
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input input-xs sm:input-sm input-bordered rounded h-8 flex-1 min-w-32 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="absolute inset-0">
              <CodeEditor value={code} onChange={handleCodeChange} />
            </div>
          </div>
        </div>
      </main>

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveWithMetadata}
        isSaving={isSaving}
      />

      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl}
        title={title}
        description={description}
        isPublic={isPublic}
        onNew={handleNew}
      />

      <SuggestionsModal
        isOpen={showSuggestionsModal}
        onClose={() => setShowSuggestionsModal(false)}
        suggestions={suggestions}
      />

      {/* Confirmation Modal */}
      <input
        ref={confirmModalRef}
        type="checkbox"
        id="confirm_modal"
        className="modal-toggle"
      />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Unsaved changes</h3>
          <p className="py-4">Unsaved changes will be lost. Are you sure?</p>
          <div className="modal-action">
            <button
              type="button"
              onClick={() => {
                setShowConfirmModal(false)
                if (confirmModalRef.current) {
                  confirmModalRef.current.checked = false
                }
              }}
              className="btn btn-ghost rounded-xl"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setShowConfirmModal(false)
                handleConfirmNew()
              }}
              className="btn btn-primary rounded-xl"
            >
              OK
            </button>
          </div>
        </div>
        <label className="modal-backdrop" htmlFor="confirm_modal" onClick={() => {
          setShowConfirmModal(false)
          if (confirmModalRef.current) {
            confirmModalRef.current.checked = false
          }
        }}></label>
      </div>

      <Footer />
    </div>
  )
}
