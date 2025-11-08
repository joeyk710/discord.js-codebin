'use client'

import React, { useState, useCallback, useEffect, useRef } from 'react'
import Navbar from './Navbar'
import CodeEditor from './CodeEditor'
import SuggestionsModal from './SuggestionsModal'
import SaveModal from './SaveModal'
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
  const [savedMessage, setSavedMessage] = useState('')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [language, setLanguage] = useState<'javascript' | 'typescript' | 'json'>('javascript')
  const confirmModalRef = useRef<HTMLInputElement>(null)

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
    setSavedMessage('')
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
          title: title || metadata.title || 'Untitled',
          description: description || metadata.description || '',
          language: metadata.language,
          isPublic: metadata.isPublic,
        }),
      })
      const data = await response.json()

      if (data.id) {
        const url = data.shortUrl || `${window.location.origin}/paste/${data.id}`
        setShareUrl(url)
        setSavedMessage('✅ Saved! Link copied to clipboard.')
        navigator.clipboard.writeText(url)
        setTimeout(() => setSavedMessage(''), 5000)
      } else {
        setSavedMessage('❌ Error saving paste')
      }
    } catch (error) {
      setSavedMessage('❌ Error saving paste')
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
    setSavedMessage('')
    setShareUrl('')
  }

  return (
    <div className="flex flex-col h-screen bg-base-100 m-3 rounded-2xl shadow-xl overflow-hidden">
      <Navbar
        onNew={handleNew}
        onSaveShare={() => setShowSaveModal(true)}
        isSaving={isSaving}
      />

      <main className="w-full px-3 py-6 flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden min-h-0">
        {/* Metadata Section */}
        <div className="w-full flex flex-col gap-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Snippet name (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input input-bordered rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <input
              type="text"
              placeholder="Brief description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input input-bordered rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Language and Tips Row */}
          <div className="flex gap-2">
            <div className="dropdown">
              <button tabIndex={0} className="btn btn-xs btn-ghost rounded-xl gap-1">
                {language === 'javascript' && '📜 JS'}
                {language === 'typescript' && '🔷 TS'}
                {language === 'json' && '📋 JSON'}
              </button>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow border border-base-300">
                <li><a onClick={() => setLanguage('javascript')}>📜 JavaScript</a></li>
                <li><a onClick={() => setLanguage('typescript')}>🔷 TypeScript</a></li>
                <li><a onClick={() => setLanguage('json')}>📋 JSON</a></li>
              </ul>
            </div>
            <button
              onClick={() => setShowSuggestionsModal(true)}
              className="btn btn-xs btn-ghost rounded-xl gap-1"
              title="View tips and suggestions"
            >
              💡 Tips & Suggestions
            </button>
          </div>

          {/* Main content area */}
          <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
            {/* Code Editor - Full Width */}
            <div className="flex flex-col rounded-xl overflow-hidden border border-base-300 shadow-lg bg-base-100 flex-1 min-h-0 w-full">
              <div className="bg-base-200 px-6 py-4 border-b border-base-300 flex items-center flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📝</span>
                  <span className="text-sm font-medium text-base-content">
                    Code Editor • {code.split('\n').length} {code.split('\n').length === 1 ? 'line' : 'lines'}
                  </span>
                </div>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0">
                  <CodeEditor value={code} onChange={handleCodeChange} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Messages */}
      <div className="w-full px-4 pb-8 flex flex-col gap-4">
        {savedMessage && (
          <div className={`alert alert-${savedMessage.includes('✅') ? 'success' : 'error'} rounded-2xl shadow-lg`}>
            <span className="text-base font-semibold">{savedMessage}</span>
            {shareUrl && (
              <div className="mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <span>Share link:</span>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link link-primary font-mono text-xs"
                  >
                    {shareUrl.split('/paste/')[1]}
                  </a>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(shareUrl)
                    }}
                    className="btn btn-xs btn-ghost rounded-xl"
                  >
                    📋 Copy
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <SaveModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSaveWithMetadata}
        isSaving={isSaving}
        language={language}
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
        <label
          className="modal-backdrop"
          htmlFor="confirm_modal"
          onClick={() => setShowConfirmModal(false)}
        ></label>
      </div>

      <div className="mt-auto -mx-3 -mb-3 rounded-b-2xl">
        <Footer />
      </div>
    </div>
  )
}
