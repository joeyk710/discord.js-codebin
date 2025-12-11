export interface DiscordUser {
    userId: string
    username: string
    avatar: string | null
}

const BROWSER_ID_KEY = 'djs-codebin-browser-id'
const BROWSER_NAME_KEY = 'djs-codebin-browser-name'

export function getBrowserId(): string {
    if (typeof window === 'undefined') return ''

    let id = localStorage.getItem(BROWSER_ID_KEY)
    if (!id) {
        id = `browser-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem(BROWSER_ID_KEY, id)
    }
    return id
}

export function getBrowserName(): string {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem(BROWSER_NAME_KEY) || 'Anonymous'
}

export function setBrowserName(name: string): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(BROWSER_NAME_KEY, name)
    }
}
