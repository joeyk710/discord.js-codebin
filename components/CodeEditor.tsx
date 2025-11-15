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
    const languageMap: { [key: string]: string } = {
      'javascript': 'javascript',
      'typescript': 'typescript',
      'json': 'json',
      'python': 'python',
      'html': 'html',
      'css': 'css',
      'markdown': 'markdown',
    }
    return languageMap[lang.toLowerCase()] || 'javascript'
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
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          acceptSuggestionOnCommitCharacter: true,
          acceptSuggestionOnEnter: "smart",
          suggest: { shareSuggestSelections: true },
          hover: { enabled: true },
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
