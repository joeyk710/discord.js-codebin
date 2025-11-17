'use client'

import { useEffect, useState } from 'react'
import MonacoEditor from '@monaco-editor/react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
}

export default function CodeEditor({ value, onChange, language = 'javascript' }: CodeEditorProps) {
  const [theme, setTheme] = useState<'vs-dark' | 'vs-light'>('vs-dark')

  useEffect(() => {
    // Detect current theme
    const updateTheme = () => {
      const htmlTheme = document.documentElement.getAttribute('data-theme')
      setTheme(htmlTheme === 'light' ? 'vs-light' : 'vs-dark')
    }

    // Initial theme
    updateTheme()

    // Watch for theme changes
    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  // Map language to Monaco language ID
  const getMonacoLanguage = (lang: string) => {
    // Accept either a language name from selector (JavaScript, TypeScript, Python...) or a filename/path with extension
    const lower = (lang || '').toLowerCase()

    // If it looks like a path/filename, infer from extension
    const maybeFile = lower.includes('/') || lower.includes('.')
    let key = lower
    if (maybeFile) {
      const parts = lower.split('/')
      const file = parts[parts.length - 1]
      if (file.includes('.')) {
        key = file.split('.').pop() || lower
      }
    }

    // Map file extensions and language names to Monaco language IDs
    const languageMap: { [key: string]: string } = {
      // File extensions - JS/TS
      'js': 'javascript', 'mjs': 'javascript', 'cjs': 'javascript', 'jsx': 'javascript',
      'ts': 'typescript', 'tsx': 'typescript', 'mts': 'typescript', 'cts': 'typescript',
      // File extensions - Common
      'py': 'python', 'pyw': 'python',
      'htm': 'html', 'html': 'html',
      'css': 'css', 'scss': 'css', 'sass': 'css', 'less': 'less',
      'md': 'markdown',
      'xml': 'xml',
      'yml': 'yaml',
      'json': 'json', 'jsonc': 'json', 'toml': 'toml',
      // File extensions - Other languages
      'rb': 'ruby', 'go': 'golang', 'java': 'java',
      'cpp': 'cpp', 'cc': 'cpp', 'c': 'c', 'h': 'c',
      'cs': 'csharp', 'php': 'php', 'sql': 'sql',
      'sh': 'shell', 'ps1': 'powershell',
      'dockerfile': 'dockerfile',
      'pl': 'perl', 'r': 'r',
      'kt': 'kotlin', 'rs': 'rust',
      'graphql': 'graphql', 'lua': 'lua',
      'hs': 'haskell', 'ml': 'ocaml', 'ex': 'elixir',
      'erl': 'erlang', 'cl': 'lisp',
      // Language names from selector (title-cased, lowercased for matching)
      'javascript': 'javascript', 'typescript': 'typescript', 'python': 'python',
      'ruby': 'ruby', 'golang': 'golang', 'c++': 'cpp', 'c#': 'csharp',
      'objective-c': 'objective-c', 'f#': 'fsharp', 'pascal': 'pascal',
      'cobol': 'cobol', 'fortran': 'fortran', 'ada': 'ada', 'prolog': 'prolog',
      'elixir': 'elixir', 'erlang': 'erlang', 'kotlin': 'kotlin',
      'scala': 'scala', 'haskell': 'haskell', 'lisp': 'lisp', 'ocaml': 'ocaml',
      'clojure': 'clojure', 'groovy': 'groovy', 'dart': 'dart', 'rust': 'rust',
      'swift': 'swift', 'perl': 'perl', 'powershell': 'powershell',
      'bash': 'bash', 'shell': 'shell', 'makefile': 'makefile',
      'markdown': 'markdown', 'yaml': 'yaml',
      'webassembly': 'wasm',
    }

    const normalized = languageMap[key] || 'javascript'
    return normalized
  }

  const handleBeforeMount = (monaco: { languages: { typescript: { typescriptDefaults: { setDiagnosticsOptions: (arg0: { noSemanticValidation: boolean; noSyntaxValidation: boolean }) => void }; javascriptDefaults: { setDiagnosticsOptions: (arg0: { noSemanticValidation: boolean; noSyntaxValidation: boolean }) => void } } } }) => {
    // Disable TypeScript diagnostics
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })

    // Disable JavaScript diagnostics
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    })
  }

  // Get responsive fontSize based on screen size
  const getResponsiveFontSize = () => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      if (width < 640) return 12 // sm
      if (width < 1024) return 13 // md
      return 14 // lg
    }
    return 14
  }

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-base-300">
      <MonacoEditor
        height="100%"
        language={getMonacoLanguage(language)}
        value={value}
        onChange={(newValue) => onChange(newValue || '')}
        theme={theme}
        beforeMount={handleBeforeMount}
        options={{
          minimap: { enabled: false },
          fontSize: getResponsiveFontSize(),
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          hover: { enabled: false },
          bracketPairColorization: { enabled: true },
          guides: {
            bracketPairs: "active",
            bracketPairsHorizontal: "active",
            highlightActiveBracketPair: true,
          },
          matchBrackets: "near",
          formatOnPaste: true,
          formatOnType: true,
          autoClosingBrackets: "languageDefined",
          smoothScrolling: true,
        }}
      />
    </div>
  )
}
