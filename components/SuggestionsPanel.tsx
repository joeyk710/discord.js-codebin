'use client'

import React from 'react'
import ReactMarkdown from 'react-markdown'
import type { Suggestion } from '@/lib/analyzer'

interface SuggestionsPanelProps {
  suggestions: Suggestion[]
  onApply?: (message: string) => void
}

export default function SuggestionsPanel({ suggestions, onApply }: SuggestionsPanelProps) {
  const getIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'error': return '❌'
      case 'warning': return '⚠️'
      case 'info': return 'ℹ️'
      case 'suggestion': return '💡'
      default: return '📝'
    }
  }

  const getColorClasses = (type: Suggestion['type']) => {
    switch (type) {
      case 'error': return 'bg-[#da3633]/20 border-[#da3633]/50 text-[#f85149]'
      case 'warning': return 'bg-[#d29922]/20 border-[#d29922]/50 text-[#d1a80a]'
      case 'info': return 'bg-[#0969da]/20 border-[#0969da]/50 text-[#58a6ff]'
      case 'suggestion': return 'bg-[#238636]/20 border-[#238636]/50 text-[#3fb950]'
      default: return 'bg-[#444c56]/20 border-[#444c56]/50 text-[#c9d1d9]'
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {suggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="text-6xl mb-4">✨</div>
            <p className="font-semibold text-[#c9d1d9] text-lg">Perfect!</p>
            <p className="text-sm text-[#8b949e] mt-2">No issues found in your code</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`p-5 rounded-lg border backdrop-blur-sm transition-all duration-300 hover:shadow-lg hover:border-[#58a6ff]/30 ${getColorClasses(suggestion.type)}`}
              >
                <div className="flex gap-3">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{getIcon(suggestion.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-base leading-snug">{suggestion.message}</p>

                    {suggestion.line && (
                      <p className="text-sm mt-2 opacity-60">Line {suggestion.line}</p>
                    )}

                    {suggestion.code && (
                      <pre className="mt-3 p-3 bg-black/40 rounded text-sm leading-relaxed overflow-x-auto text-[#c9d1d9] border border-white/10 font-mono">
                        <code>{suggestion.code}</code>
                      </pre>
                    )}

                    {suggestion.details && (
                      <div className="text-sm mt-3 opacity-85 leading-relaxed prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            h2: ({ node, ...props }) => <h2 className="text-base font-bold mt-3 mb-2 text-[#c9d1d9]" {...props} />,
                            h3: ({ node, ...props }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-[#c9d1d9]" {...props} />,
                            p: ({ node, ...props }) => <p className="mb-2" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                            li: ({ node, ...props }) => <li className="ml-2" {...props} />,
                            code: ({ node, ...props }: any) => (
                              <code className="bg-black/40 px-2 py-0.5 rounded text-[#79c0ff] font-mono text-xs" {...props} />
                            ),
                            pre: ({ node, ...props }) => (
                              <pre className="mt-2 p-3 bg-black/40 rounded text-sm leading-relaxed overflow-x-auto text-[#c9d1d9] border border-white/10 font-mono mb-2" {...props} />
                            ),
                            strong: ({ node, ...props }) => <strong className="font-bold text-[#79c0ff]" {...props} />,
                            em: ({ node, ...props }) => <em className="italic text-[#79c0ff]" {...props} />,
                          }}
                        >
                          {suggestion.details}
                        </ReactMarkdown>
                      </div>
                    )}

                    {onApply && (
                      <button
                        onClick={() => onApply(suggestion.message)}
                        className="mt-3 px-4 py-2 text-sm rounded-lg bg-[#238636] hover:bg-[#2ea043] text-white font-semibold transition-colors duration-200 active:scale-95"
                      >
                        Apply Fix
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
