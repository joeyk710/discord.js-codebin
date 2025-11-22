export interface FileNode {
    id: string
    name: string
    path: string
    type: 'file' | 'folder'
    language?: string
    children?: FileNode[]
}

export function buildFileTree(files: Array<{ id: string; path: string; name: string; language: string }>, extraFolders: string[] = []): FileNode[] {
    const tree: { [key: string]: FileNode } = {}
    const root: FileNode[] = []

    // Create entries for all files
    for (const file of files) {
        tree[file.path] = {
            id: file.id,
            name: file.name,
            path: file.path,
            type: 'file',
            language: file.language,
        }
    }

    // Build folder structure
    const folders = new Set<string>()
    for (const file of files) {
        const parts = file.path.split('/')
        let currentPath = ''

        for (let i = 0; i < parts.length - 1; i++) {
            currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i]

            if (!folders.has(currentPath)) {
                folders.add(currentPath)
                tree[currentPath] = {
                    id: currentPath,
                    name: parts[i],
                    path: currentPath,
                    type: 'folder',
                    children: [],
                }
            }
        }
    }

    // Include extraFolders (created via UI) so empty folders are shown
    for (const f of extraFolders) {
        const fp = f.trim()
        if (!fp) continue
        // normalize no leading/trailing slash
        const norm = fp.replace(/^\/|\/$/g, '')
        if (!folders.has(norm)) {
            const parts = norm.split('/')
            const name = parts[parts.length - 1]
            folders.add(norm)
            tree[norm] = {
                id: norm,
                name,
                path: norm,
                type: 'folder',
                children: [],
            }
        }
    }

    // Organize files into folders
    for (const file of files) {
        const parts = file.path.split('/')

        if (parts.length === 1) {
            // Root level file
            root.push(tree[file.path])
        } else {
            // File in a folder
            const folderPath = parts.slice(0, -1).join('/')
            const folder = tree[folderPath]
            if (folder && !folder.children) {
                folder.children = []
            }
            folder?.children?.push(tree[file.path])
        }
    }

    // Add folders to root or their parent folders
    for (const folderPath of folders) {
        const folder = tree[folderPath]
        const parts = folderPath.split('/')

        if (parts.length === 1) {
            // Root level folder
            if (!root.find(n => n.path === folderPath)) {
                root.push(folder)
            }
        } else {
            // Nested folder
            const parentPath = parts.slice(0, -1).join('/')
            const parentFolder = tree[parentPath]
            if (parentFolder && !parentFolder.children?.find(n => n.path === folderPath)) {
                if (!parentFolder.children) {
                    parentFolder.children = []
                }
                parentFolder.children.push(folder)
            }
        }
    }

    // Sort children alphabetically, folders first
    const sortNodes = (nodes: FileNode[]): FileNode[] => {
        return nodes.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1
            }
            return a.name.localeCompare(b.name)
        })
    }

    const sortTree = (nodes: FileNode[]): FileNode[] => {
        return sortNodes(
            nodes.map(node => ({
                ...node,
                children: node.children ? sortTree(node.children) : undefined,
            }))
        )
    }

    return sortTree(root)
}

export function getLanguageIcon(language: string): string {
    const icons: { [key: string]: string } = {
        javascript: '📄',
        typescript: '📘',
        json: '📋',
        markdown: '📝',
        html: '🌐',
        css: '🎨',
        python: '🐍',
        java: '☕',
        cpp: '⚙️',
        csharp: '🔷',
        ruby: '💎',
        php: '🐘',
        sql: '🗄️',
        yaml: '⚙️',
        xml: '📦',
    }
    return icons[language.toLowerCase()] || '📄'
}

// Return a material icon filename (without extension) for languages that have icons in /public/material-icons
export function getMaterialIconFilename(language: string): string | null {
    if (!language) return null
    const lang = language.toLowerCase()

    const map: { [key: string]: string } = {
        'javascript': 'javascript',
        'typescript': 'typescript',
        'json': 'json',
        'markdown': 'markdown',
        'html': 'html',
        'css': 'css',
        'python': 'python',
        'java': 'java',
        'c++': 'cpp',
        'cpp': 'cpp',
        'c#': 'csharp',
        'csharp': 'csharp',
        'ruby': 'ruby',
        'php': 'php',
        'sql': 'sql',
        'yaml': 'yaml',
        'xml': 'xml',
        'go': 'go',
        'rust': 'rust',
        'swift': 'swift',
        'kotlin': 'kotlin',
        'scala': 'scala',
        'r': 'r',
        'matlab': 'matlab',
        'objective-c': 'objective-c',
        'objectivec': 'objective-c',
        'groovy': 'groovy',
        'clojure': 'clojure',
        'haskell': 'haskell',
        'elixir': 'elixir',
        'erlang': 'erlang',
        'ocaml': 'ocaml',
        'scheme': 'scheme',
        'lisp': 'lisp',
        'lua': 'lua',
        'perl': 'perl',
        'powershell': 'powershell',
        'pascal': 'pascal',
        'cobol': 'cobol',
        'fortran': 'fortran',
        'ada': 'ada',
        'prolog': 'prolog',
        'dart': 'dart',
        'solidity': 'solidity',
        'webassembly': 'webassembly',
        'scss': 'sass',
        'sass': 'sass',
        'less': 'less',
        'toml': 'toml',
        'graphql': 'graphql',
        'dockerfile': 'docker',
        'docker': 'docker',
        'makefile': 'makefile',
    }

    return map[lang] ?? null
}

// Infer language key from a filename's extension. Returns a language string
// that matches the keys used in getMaterialIconFilename (e.g., 'javascript', 'typescript')
export function inferLanguageFromFilename(filename: string): string | null {
    if (!filename) return null
    const name = filename.toLowerCase()
    const lastDot = name.lastIndexOf('.')
    if (lastDot === -1) return null
    const ext = name.substring(lastDot + 1)

    const extMap: { [key: string]: string } = {
        'js': 'javascript',
        'cjs': 'javascript',
        'mjs': 'javascript',
        'ts': 'typescript',
        'tsx': 'typescript',
        'jsx': 'javascript',
        'json': 'json',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'cc': 'cpp',
        'c': 'c',
        'cs': 'csharp',
        'php': 'php',
        'rb': 'ruby',
        'go': 'go',
        'rs': 'rust',
        'swift': 'swift',
        'kt': 'kotlin',
        'kts': 'kotlin',
        'scala': 'scala',
        'r': 'r',
        'm': 'matlab',
        'html': 'html',
        'htm': 'html',
        'css': 'css',
        'scss': 'sass',
        'sass': 'sass',
        'less': 'less',
        'md': 'markdown',
        'markdown': 'markdown',
        'xml': 'xml',
        'yml': 'yaml',
        'yaml': 'yaml',
        'toml': 'toml',
        'sql': 'sql',
        'graphql': 'graphql',
        'dockerfile': 'docker',
        'docker': 'docker',
        'makefile': 'makefile',
    }

    return extMap[ext] ?? null
}
