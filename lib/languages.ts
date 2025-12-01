export const SUPPORTED_LANGUAGES = [
    'JavaScript',
    'TypeScript',
    'JSON',
    'Text',
]

// Map a language display name to a common file extension (lowercase, without dot).
// Values are best-effort and used only for validation / suggested filenames.
export function getExtensionForLanguage(lang: string): string {
    const m: Record<string, string> = {
        'javascript': 'js',
        'typescript': 'ts',
        'json': 'json',
        'text': 'txt',
    }

    return m[(lang || '').toLowerCase()] ?? 'txt'
}
