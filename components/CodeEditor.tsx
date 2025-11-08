'use client'

import { useRef, useEffect, useState } from 'react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
}

// Advanced JavaScript syntax highlighter
const highlightCode = (code: string): JSX.Element[] => {
  const tokens: JSX.Element[] = []
  let tokenKey = 0

  // Define token patterns with priority (order matters)
  const patterns = [
    // Comments (must be first)
    { regex: /\/\/.*$/gm, class: 'text-slate-500 italic' },
    { regex: /\/\*[\s\S]*?\*\//g, class: 'text-slate-500 italic' },

    // Strings and template literals
    { regex: /`[^`]*`/g, class: 'text-emerald-300' }, // Template literals - brighter
    { regex: /'(?:\\.|[^'\\])*'/g, class: 'text-green-400' }, // Single quotes
    { regex: /"(?:\\.|[^"\\])*"/g, class: 'text-green-400' }, // Double quotes

    // Regular expressions
    { regex: /\/(?:\\.|[^\/\\\n])+\/[gimsuvy]*/g, class: 'text-orange-400' },

    // Numbers (including hex, binary, octal, decimals)
    { regex: /\b(0x[0-9a-fA-F]+|0b[01]+|0o[0-7]+|\d+\.?\d*([eE][+-]?\d+)?)\b/g, class: 'text-amber-300' },

    // Boolean and null literals
    { regex: /\b(true|false|null|undefined|NaN|Infinity)\b/g, class: 'text-purple-400 font-semibold' },

    // Keywords (grouped by category for better highlighting)
    { regex: /\b(const|let|var|function|async|await|class|extends|implements|interface|type|enum|namespace)\b/g, class: 'text-blue-400 font-semibold' },
    { regex: /\b(return|throw|try|catch|finally|new|this|super|static|public|private|protected)\b/g, class: 'text-blue-400 font-semibold' },
    { regex: /\b(if|else|switch|case|break|continue|for|while|do|default)\b/g, class: 'text-pink-400 font-semibold' },
    { regex: /\b(import|export|from|as|default)\b/g, class: 'text-indigo-400 font-semibold' },
    { regex: /\b(typeof|instanceof|in|of|delete|void)\b/g, class: 'text-red-400 font-semibold' },

    // Built-in objects and methods
    { regex: /\b(console|Math|Object|Array|String|Number|Boolean|Date|RegExp|Error|JSON|Promise|Map|Set|WeakMap|WeakSet|Symbol|Proxy|Reflect|Promise|async|await)\b/g, class: 'text-cyan-300' },
    { regex: /\b(process|Buffer|require|module|exports|global|globalThis)\b/g, class: 'text-cyan-300' },

    // Function names (followed by parentheses)
    { regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, class: 'text-yellow-300' },

    // Class/constructor names (capitalized)
    { regex: /\b([A-Z][a-zA-Z0-9_$]*)\b(?=\s*[\(\{])/g, class: 'text-lime-300' },

    // Properties and member access
    { regex: /\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, class: 'text-cyan-400' },
    { regex: /\[([a-zA-Z_$][a-zA-Z0-9_$]*)\]/g, class: 'text-cyan-400' },
  ]

  // Create a map of all matches with their ranges
  const matches: Array<{ start: number; end: number; class: string; text: string }> = []

  for (const pattern of patterns) {
    let match: RegExpExecArray | null
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags)

    while ((match = regex.exec(code)) !== null) {
      // Skip if this match overlaps with an existing match
      const overlaps = matches.some(m =>
        (match && match.index >= m.start && match.index < m.end) ||
        (match && match.index + match[0].length > m.start && match.index + match[0].length <= m.end)
      )

      if (!overlaps && match) {
        matches.push({
          start: match.index,
          end: match.index + match[0].length,
          class: pattern.class,
          text: match[0],
        })
      }
    }
  }

  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start)

  // Build token array
  let lastIndex = 0
  for (const token of matches) {
    // Add plain text before token
    if (token.start > lastIndex) {
      const plainText = code.substring(lastIndex, token.start)
      if (plainText) {
        tokens.push(
          <span key={tokenKey++}>
            {plainText}
          </span>
        )
      }
    }

    // Add highlighted token
    tokens.push(
      <span key={tokenKey++} className={token.class}>
        {token.text}
      </span>
    )

    lastIndex = token.end
  }

  // Add remaining plain text
  if (lastIndex < code.length) {
    const plainText = code.substring(lastIndex)
    if (plainText) {
      tokens.push(
        <span key={tokenKey++}>
          {plainText}
        </span>
      )
    }
  }

  return tokens.length ? tokens : [<span key={tokenKey}>{code}</span>]
}

export default function CodeEditor({ value, onChange }: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const highlightRef = useRef<HTMLDivElement>(null)
  const [highlightedCode, setHighlightedCode] = useState<JSX.Element[]>([])

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current && highlightRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollTop = textareaRef.current.scrollTop
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft
    }
  }

  const updateLineNumbers = () => {
    if (!lineNumbersRef.current || !textareaRef.current) return
    const lines = textareaRef.current.value.split('\n').length
    lineNumbersRef.current.innerHTML = Array.from({ length: lines }, (_, i) =>
      `<div class="line-number">${i + 1}</div>`
    ).join('')
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value)
    updateLineNumbers()
    setHighlightedCode(highlightCode(e.target.value))
  }

  useEffect(() => {
    updateLineNumbers()
    setHighlightedCode(highlightCode(value))
  }, [value])

  return (
    <div className="relative w-full h-full bg-slate-900 text-slate-100 font-mono text-sm overflow-hidden rounded-lg border border-slate-700">
      <div className="flex h-full">
        {/* Line numbers */}
        <div
          ref={lineNumbersRef}
          className="bg-slate-800 text-slate-500 select-none border-r border-slate-700 px-3 py-2 overflow-hidden flex-shrink-0"
          style={{ minWidth: '50px', paddingTop: '1rem', paddingBottom: '1rem' }}
        />

        {/* Editor with highlight and textarea */}
        <div className="flex-1 relative overflow-hidden">
          {/* Highlight layer - overlaid absolutely */}
          <div
            ref={highlightRef}
            className="absolute inset-0 text-slate-100 p-4 pointer-events-none whitespace-pre-wrap break-words overflow-hidden"
            style={{
              lineHeight: '1.5rem',
              tabSize: 2,
              wordBreak: 'break-all',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            {highlightedCode}
          </div>

          {/* Editor textarea - positioned absolutely to match highlight perfectly */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onScroll={handleScroll}
            className="absolute inset-0 bg-transparent text-transparent caret-white outline-none resize-none font-mono z-10 overflow-y-auto"
            spellCheck="false"
            style={{
              lineHeight: '1.5rem',
              tabSize: 2,
              padding: '1rem',
            }}
          />
        </div>
      </div>

      <style>{`
        .line-number {
          height: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding-right: 0.5rem;
          user-select: none;
        }
      `}</style>
    </div>
  )
}
