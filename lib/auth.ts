export interface DiscordUser {
    userId: string
    username: string
    avatar: string | null
    email: string | null
    discriminator: string
}

export function parseSessionToken(token: string | undefined): DiscordUser | null {
    try {
        if (!token) return null
        // Use browser-compatible base64 decoding instead of Buffer
        const decodedString = typeof window !== 'undefined' 
            ? atob(token) 
            : Buffer.from(token, 'base64').toString('utf-8')
        const sessionData = JSON.parse(decodedString)
        return sessionData as DiscordUser
    } catch (error) {
        // Silently return null for invalid sessions (don't log errors)
        // This can happen if the cookie is corrupted or from an old format
        if (typeof window !== 'undefined') {
            // Clear the bad cookie
            document.cookie = 'discord_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
        }
        return null
    }
}

export function getDiscordAvatarUrl(userId: string, avatar: string | null): string {
    if (!avatar) {
        // Default Discord avatar based on discriminator
        return `https://cdn.discordapp.com/embed/avatars/${Math.floor(Math.random() * 5)}.png`
    }
    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`
}
