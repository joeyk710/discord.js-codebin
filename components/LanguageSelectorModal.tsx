'use client'

import React, { useState, useMemo, useRef, useEffect, forwardRef } from 'react'

interface LanguageSelectorModalProps {
    onClose: () => void
    onSelect: (language: string) => void
    currentLanguage: string
}

const SUPPORTED_LANGUAGES = [
    'Ada',
    'Bash',
    'C#',
    'C++',
    'COBOL',
    'CSS',
    'Clojure',
    'Dart',
    'Dockerfile',
    'Elixir',
    'Erlang',
    'F#',
    'Fortran',
    'Go',
    'GraphQL',
    'Groovy',
    'Haskell',
    'HTML',
    'Java',
    'JavaScript',
    'JSON',
    'Kotlin',
    'Less',
    'Lisp',
    'Lua',
    'Makefile',
    'MATLAB',
    'Markdown',
    'OCaml',
    'Objective-C',
    'Pascal',
    'Perl',
    'PHP',
    'PowerShell',
    'Prolog',
    'Python',
    'R',
    'Ruby',
    'Rust',
    'SASS',
    'Scheme',
    'Scala',
    'Solidity',
    'SQL',
    'Swift',
    'TypeScript',
    'TOML',
    'WebAssembly',
    'XML',
    'YAML',
]


const getLanguageIcon = (language: string) => {
    // Use static icons downloaded into public/material-icons when available
    const iconMap: Record<string, React.ReactNode> = {
        'JavaScript': <img src="/material-icons/javascript.svg" alt="JavaScript" className="w-6 h-6" />,
        'TypeScript': <img src="/material-icons/typescript.svg" alt="TypeScript" className="w-6 h-6" />,
        'Python': <img src="/material-icons/python.svg" alt="Python" className="w-6 h-6" />,
        'Java': <img src="/material-icons/java.svg" alt="Java" className="w-6 h-6" />,
        'C++': <img src="/material-icons/cpp.svg" alt="C++" className="w-6 h-6" />,
        'C#': <img src="/material-icons/csharp.svg" alt="C#" className="w-6 h-6" />,
        'PHP': <img src="/material-icons/php.svg" alt="PHP" className="w-6 h-6" />,
        'Ruby': <img src="/material-icons/ruby.svg" alt="Ruby" className="w-6 h-6" />,
        'Go': <img src="/material-icons/go.svg" alt="Go" className="w-6 h-6" />,
        'Rust': <img src="/material-icons/rust.svg" alt="Rust" className="w-6 h-6" />,
        'Swift': <img src="/material-icons/swift.svg" alt="Swift" className="w-6 h-6" />,
        'Kotlin': <img src="/material-icons/kotlin.svg" alt="Kotlin" className="w-6 h-6" />,
        'Scala': <img src="/material-icons/scala.svg" alt="Scala" className="w-6 h-6" />,
        'R': <img src="/material-icons/r.svg" alt="R" className="w-6 h-6" />,
        'MATLAB': <img src="/material-icons/matlab.svg" alt="MATLAB" className="w-6 h-6" />,
        'Objective-C': <img src="/material-icons/objective-c.svg" alt="Objective-C" className="w-6 h-6" />,
        'Groovy': <img src="/material-icons/groovy.svg" alt="Groovy" className="w-6 h-6" />,
        'Clojure': <img src="/material-icons/clojure.svg" alt="Clojure" className="w-6 h-6" />,
        'Haskell': <img src="/material-icons/haskell.svg" alt="Haskell" className="w-6 h-6" />,
        'Elixir': <img src="/material-icons/elixir.svg" alt="Elixir" className="w-6 h-6" />,
        'Erlang': <img src="/material-icons/erlang.svg" alt="Erlang" className="w-6 h-6" />,
        'OCaml': <img src="/material-icons/ocaml.svg" alt="OCaml" className="w-6 h-6" />,
        'Scheme': <img src="/material-icons/scheme.svg" alt="Scheme" className="w-6 h-6" />,
        'Lisp': <img src="/material-icons/lisp.svg" alt="Lisp" className="w-6 h-6" />,
        'Lua': <img src="/material-icons/lua.svg" alt="Lua" className="w-6 h-6" />,
        'Perl': <img src="/material-icons/perl.svg" alt="Perl" className="w-6 h-6" />,
        'PowerShell': <img src="/material-icons/powershell.svg" alt="PowerShell" className="w-6 h-6" />,
        'Pascal': <img src="/material-icons/pascal.svg" alt="Pascal" className="w-6 h-6" />,
        'COBOL': <img src="/material-icons/cobol.svg" alt="COBOL" className="w-6 h-6" />,
        'Fortran': <img src="/material-icons/fortran.svg" alt="Fortran" className="w-6 h-6" />,
        'Ada': <img src="/material-icons/ada.svg" alt="Ada" className="w-6 h-6" />,
        'Prolog': <img src="/material-icons/prolog.svg" alt="Prolog" className="w-6 h-6" />,
        'Dart': <img src="/material-icons/dart.svg" alt="Dart" className="w-6 h-6" />,
        'Solidity': <img src="/material-icons/solidity.svg" alt="Solidity" className="w-6 h-6" />,
        'WebAssembly': <img src="/material-icons/webassembly.svg" alt="WebAssembly" className="w-6 h-6" />,
        'HTML': <img src="/material-icons/html.svg" alt="HTML" className="w-6 h-6" />,
        'CSS': <img src="/material-icons/css.svg" alt="CSS" className="w-6 h-6" />,
        'SASS': <img src="/material-icons/sass.svg" alt="SASS" className="w-6 h-6" />,
        'Less': <img src="/material-icons/less.svg" alt="Less" className="w-6 h-6" />,
        'JSON': <img src="/material-icons/json.svg" alt="JSON" className="w-6 h-6" />,
        'XML': <img src="/material-icons/xml.svg" alt="XML" className="w-6 h-6" />,
        'YAML': <img src="/material-icons/yaml.svg" alt="YAML" className="w-6 h-6" />,
        'TOML': <img src="/material-icons/toml.svg" alt="TOML" className="w-6 h-6" />,
        'Markdown': <img src="/material-icons/markdown.svg" alt="Markdown" className="w-6 h-6" />,
        'GraphQL': <img src="/material-icons/graphql.svg" alt="GraphQL" className="w-6 h-6" />,
        'Dockerfile': <img src="/material-icons/docker.svg" alt="Dockerfile" className="w-6 h-6" />,
        'Makefile': <img src="/material-icons/makefile.svg" alt="Makefile" className="w-6 h-6" />,
        'F#': <img src="/material-icons/fsharp.svg" alt="F#" className="w-6 h-6" />,
        'Bash': <img src="/material-icons/bashly.svg" alt="Bash" className="w-6 h-6" />,
    }

    if (iconMap[language]) {
        return iconMap[language]
    }

    // Return emoji for other languages
    return <span className="text-xl">{'📄'}</span>
}

// Simple fuzzy search implementation
const fuzzySearch = (query: string, items: string[]): string[] => {
    if (!query.trim()) return items

    const lowerQuery = query.toLowerCase()
    const scored = items.map((item) => {
        let score = 0
        let queryIndex = 0
        let itemLower = item.toLowerCase()

        for (let i = 0; i < itemLower.length; i++) {
            if (queryIndex < lowerQuery.length && itemLower[i] === lowerQuery[queryIndex]) {
                score += 10
                queryIndex++
            } else {
                score -= 1
            }
        }

        // Boost score if query is at the start
        if (itemLower.startsWith(lowerQuery)) {
            score += 50
        }

        return { item, score, matches: queryIndex === lowerQuery.length }
    })

    return scored
        .filter((s) => s.matches)
        .sort((a, b) => b.score - a.score)
        .map((s) => s.item)
}

export default forwardRef<HTMLDialogElement, LanguageSelectorModalProps>(
    function LanguageSelectorModal({ onClose, onSelect, currentLanguage }, ref) {
        const [searchQuery, setSearchQuery] = useState('')
        const [selectedIndex, setSelectedIndex] = useState(0)
        const inputRef = useRef<HTMLInputElement>(null)

        const filteredLanguages = useMemo(
            () => fuzzySearch(searchQuery, SUPPORTED_LANGUAGES),
            [searchQuery]
        )

        useEffect(() => {
            if (inputRef.current) {
                inputRef.current.focus()
            }
        }, [])

        const handleSelect = (language: string) => {
            onSelect(language)
            onClose()
        }

        const handleKeyDown = (e: React.KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault()
                    setSelectedIndex((prev) => (prev + 1) % filteredLanguages.length)
                    break
                case 'ArrowUp':
                    e.preventDefault()
                    setSelectedIndex((prev) =>
                        prev === 0 ? filteredLanguages.length - 1 : prev - 1
                    )
                    break
                case 'Enter':
                    e.preventDefault()
                    if (filteredLanguages.length > 0) {
                        handleSelect(filteredLanguages[selectedIndex])
                    }
                    break
                case 'Escape':
                    e.preventDefault()
                    onClose()
                    break
            }
        }

        return (
            <dialog ref={ref} className="modal">
                <div className="modal-box rounded-2xl max-w-lg max-h-[90vh] overflow-y-auto">
                    <h3 className="font-bold text-lg mb-4">Select Language</h3>

                    {/* Search Input */}
                    <div className="mb-4">
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="Search languages..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setSelectedIndex(0)
                            }}
                            onKeyDown={handleKeyDown}
                            className="input input-primary w-full input-sm rounded-lg"
                        />
                    </div>

                    {/* Language List */}
                    <div className="overflow-y-auto max-h-64 mb-4">
                        {filteredLanguages.length > 0 ? (
                            <ul className="space-y-2">
                                {filteredLanguages.map((language, index) => (
                                    <li key={language}>
                                        <button
                                            onClick={() => handleSelect(language)}
                                            className={`w-full text-left rounded-lg py-3 px-4 transition-colors flex items-center justify-between ${index === selectedIndex ? 'bg-primary text-primary-content' : 'hover:bg-base-200'
                                                } ${currentLanguage === language
                                                    ? 'font-bold'
                                                    : ''
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {getLanguageIcon(language)}
                                                <span className="text-base">{language}</span>
                                            </div>
                                            {currentLanguage === language && (
                                                <span className="badge badge-primary text-xs">Current</span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8 text-base-content/50">
                                No languages found
                            </div>
                        )}
                    </div>

                    {/* Helper text */}
                    <div className="text-xs text-base-content/60 mb-4">
                        ↑↓ Navigate • Enter Select • Esc Close
                    </div>

                    {/* Modal Actions */}
                    <div className="modal-action">
                        <form method="dialog">
                            <button className="btn btn-ghost rounded-xl">Close</button>
                        </form>
                    </div>
                </div>

                {/* Backdrop */}
                <form method="dialog" className="modal-backdrop">
                    <button onClick={onClose} />
                </form>
            </dialog>
        )
    }
)
