'use client'

import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'

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

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden border border-base-300">
      <Editor
        height="100%"
        language={getMonacoLanguage(language)}
        value={value}
        onChange={(newValue) => onChange(newValue || '')}
        theme={theme}
        beforeMount={handleBeforeMount}
        options={{
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
            bracketPairsHorizontal: "active",
            highlightActiveBracketPair: true,
          },
          matchBrackets: 'near',
        }}
      />
    </div>
  )
}
