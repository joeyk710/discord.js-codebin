'use client'

import { useEffect, useState, useRef, useImperativeHandle, forwardRef } from 'react'
import MonacoEditor, { type Monaco } from '@monaco-editor/react'

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
}

export interface CodeEditorHandle {
  highlightLine: (lineNumber: number) => void
}

const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  ({ value, onChange, language = 'javascript' }, ref) => {
    const [theme, setTheme] = useState<'vs-dark' | 'vs-light'>('vs-dark')
    const editorRef = useRef<any>(null)
    const monacoRef = useRef<Monaco | null>(null)

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
        js: 'javascript',
        mjs: 'javascript',
        cjs: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        mts: 'typescript',
        cts: 'typescript',
        // File extensions - Common
        py: 'python',
        pyw: 'python',
        htm: 'html',
        html: 'html',
        css: 'css',
        scss: 'css',
        sass: 'css',
        less: 'less',
        md: 'markdown',
        xml: 'xml',
        yml: 'yaml',
        json: 'json',
        jsonc: 'json',
        toml: 'toml',
        // File extensions - Other languages
        rb: 'ruby',
        go: 'golang',
        java: 'java',
        cpp: 'cpp',
        cc: 'cpp',
        c: 'c',
        h: 'c',
        cs: 'csharp',
        php: 'php',
        sql: 'sql',
        sh: 'shell',
        ps1: 'powershell',
        dockerfile: 'dockerfile',
        pl: 'perl',
        r: 'r',
        kt: 'kotlin',
        rs: 'rust',
        graphql: 'graphql',
        lua: 'lua',
        hs: 'haskell',
        ml: 'ocaml',
        ex: 'elixir',
        erl: 'erlang',
        cl: 'lisp',
        // Language names from selector (title-cased, lowercased for matching)
        javascript: 'javascript',
        typescript: 'typescript',
        python: 'python',
        ruby: 'ruby',
        golang: 'golang',
        'c++': 'cpp',
        'c#': 'csharp',
        'objective-c': 'objective-c',
        'f#': 'fsharp',
        pascal: 'pascal',
        cobol: 'cobol',
        fortran: 'fortran',
        ada: 'ada',
        prolog: 'prolog',
        elixir: 'elixir',
        erlang: 'erlang',
        kotlin: 'kotlin',
        scala: 'scala',
        haskell: 'haskell',
        lisp: 'lisp',
        ocaml: 'ocaml',
        clojure: 'clojure',
        groovy: 'groovy',
        dart: 'dart',
        rust: 'rust',
        swift: 'swift',
        perl: 'perl',
        powershell: 'powershell',
        bash: 'bash',
        shell: 'shell',
        makefile: 'makefile',
        markdown: 'markdown',
        yaml: 'yaml',
        webassembly: 'wasm',
      }

      const normalized = languageMap[key] || 'javascript'
      return normalized
    }

    const handleBeforeMount = (monaco: any) => {
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

    // Expose highlightLine method
    useImperativeHandle(
      ref,
      () => ({
        highlightLine: (lineNumber: number) => {
          if (editorRef.current && monacoRef.current) {
            const editor = editorRef.current
            const monaco = monacoRef.current

            // Set selection to the line
            editor.setSelection(new monaco.Range(lineNumber, 0, lineNumber, 1))

            // Scroll to line
            editor.revealLineInCenter(lineNumber)

            // Highlight the line with a decoration
            const decorations = editor.deltaDecorations(
              [],
              [
                {
                  range: new monaco.Range(lineNumber, 0, lineNumber, Infinity),
                  options: {
                    isWholeLine: true,
                    className: 'highlight-line',
                    glyphMarginClassName: 'highlight-glyph',
                    glyphMarginHoverMessage: { value: 'Referenced line' },
                    backgroundColor: 'rgba(255, 215, 0, 0.2)',
                    borderColor: 'rgba(255, 215, 0, 0.5)',
                    borderStyle: 'solid',
                    borderWidth: '2px 0px 2px 0px',
                  },
                },
              ]
            )

            // Remove highlight after 2 seconds
            setTimeout(() => {
              if (editorRef.current) {
                editorRef.current.deltaDecorations(decorations, [])
              }
            }, 2000)
          }
        },
      }),
      []
    )

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
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            hover: { enabled: false },
            bracketPairColorization: { enabled: true },
            guides: {
              bracketPairs: 'active',
              bracketPairsHorizontal: 'active',
              highlightActiveBracketPair: true,
            },
            matchBrackets: 'near',
            formatOnPaste: true,
            formatOnType: true,
            autoClosingBrackets: 'languageDefined',
            smoothScrolling: true,
          }}
          onMount={(editor, monaco) => {
            editorRef.current = editor
            monacoRef.current = monaco
          }}
        />
      </div>
    )
  }
)

CodeEditor.displayName = 'CodeEditor'

export default CodeEditor
