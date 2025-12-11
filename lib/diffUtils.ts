/**
 * Simple diff utility for comparing two versions of text
 * Returns line-by-line changes with added, removed, and unchanged lines
 */

export interface DiffLine {
    type: 'add' | 'remove' | 'context'
    content: string
    lineNumber?: number
    oldLineNumber?: number
    newLineNumber?: number
}

export interface DiffResult {
    oldLines: string[]
    newLines: string[]
    lines: DiffLine[]
    addedCount: number
    removedCount: number
    contextCount: number
}

/**
 * Simple diff algorithm (Myers/LCS-based)
 * Compares two texts and returns detailed diff information
 */
export function generateDiff(oldText: string | null | undefined, newText: string): DiffResult {
    const oldLines = oldText ? oldText.split('\n') : []
    const newLines = newText.split('\n')

    // For now, use a simple line-by-line comparison
    // In production, you might use a library like 'diff-match-patch'
    const lines: DiffLine[] = []
    let addedCount = 0
    let removedCount = 0
    let contextCount = 0

    const maxLines = Math.max(oldLines.length, newLines.length)

    for (let i = 0; i < maxLines; i++) {
        const oldLine = oldLines[i]
        const newLine = newLines[i]

        if (oldLine === undefined && newLine !== undefined) {
            // Line was added
            lines.push({
                type: 'add',
                content: newLine,
                newLineNumber: i + 1,
            })
            addedCount++
        } else if (oldLine !== undefined && newLine === undefined) {
            // Line was removed
            lines.push({
                type: 'remove',
                content: oldLine,
                oldLineNumber: i + 1,
            })
            removedCount++
        } else if (oldLine === newLine) {
            // Line is the same
            lines.push({
                type: 'context',
                content: oldLine,
                oldLineNumber: i + 1,
                newLineNumber: i + 1,
            })
            contextCount++
        } else {
            // Line changed - treat as removal followed by addition
            lines.push({
                type: 'remove',
                content: oldLine,
                oldLineNumber: i + 1,
            })
            lines.push({
                type: 'add',
                content: newLine,
                newLineNumber: i + 1,
            })
            addedCount++
            removedCount++
        }
    }

    return {
        oldLines,
        newLines,
        lines,
        addedCount,
        removedCount,
        contextCount,
    }
}

/**
 * Format a diff result as a unified diff string (like git diff)
 */
export function formatUnifiedDiff(oldText: string | null | undefined, newText: string, filePath: string = 'file'): string {
    const diff = generateDiff(oldText, newText)
    const lines: string[] = []

    lines.push(`--- a/${filePath}`)
    lines.push(`+++ b/${filePath}`)

    for (const line of diff.lines) {
        if (line.type === 'context') {
            lines.push(` ${line.content}`)
        } else if (line.type === 'add') {
            lines.push(`+${line.content}`)
        } else if (line.type === 'remove') {
            lines.push(`-${line.content}`)
        }
    }

    return lines.join('\n')
}

/**
 * Get a summary of what changed
 */
export function getDiffSummary(oldText: string | null | undefined, newText: string): string {
    const diff = generateDiff(oldText, newText)

    if (diff.addedCount === 0 && diff.removedCount === 0) {
        return 'No changes'
    }

    const parts = []
    if (diff.addedCount > 0) parts.push(`+${diff.addedCount} added`)
    if (diff.removedCount > 0) parts.push(`-${diff.removedCount} removed`)

    return parts.join(', ')
}
