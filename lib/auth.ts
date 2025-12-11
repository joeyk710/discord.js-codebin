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
        const sessionData = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
        return sessionData as DiscordUser
    } catch (error) {
        console.error('Failed to parse session:', error)
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
