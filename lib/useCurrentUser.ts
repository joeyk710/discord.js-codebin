'use client'

import { useEffect, useState } from 'react'
import { parseSessionToken, DiscordUser } from '@/lib/auth'

export function useCurrentUser() {
    const [currentUser, setCurrentUser] = useState<DiscordUser | null>(null)

    const readUserFromCookie = (silent = false) => {
        try {
            // Get all cookies
            const cookies = document.cookie.split('; ')
            let sessionToken = null

            for (const cookie of cookies) {
                if (cookie.startsWith('discord_session=')) {
                    sessionToken = cookie.substring('discord_session='.length)
                    break
                }
            }

            if (sessionToken) {
                if (!silent) console.log('Found discord_session cookie, parsing...')
                const user = parseSessionToken(sessionToken)
                if (!silent && user) {
                    console.log('Parsed user:', {
                        userId: user.userId,
                        username: user.username,
                        avatar: user.avatar ? '(set)' : '(none)',
                        // Don't log email - it's PII
                    })
                }
                setCurrentUser(user)
            } else {
                if (!silent) console.log('No discord_session cookie found')
                setCurrentUser(null)
            }
        } catch (error) {
            console.error('Error reading user from cookie:', error)
            setCurrentUser(null)
        }
    }

    useEffect(() => {
        // Read user on mount (log it)
        readUserFromCookie(false)

        // Poll frequently to catch cookie changes after redirect (silent polling)
        const pollInterval = setInterval(() => {
            readUserFromCookie(true)
        }, 500)

        // Also listen for page visibility
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                console.log('Page became visible, checking for user...')
                readUserFromCookie(false)
            }
        }
        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            clearInterval(pollInterval)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [])

    return currentUser
}
