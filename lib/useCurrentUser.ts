'use client'

import { useEffect, useState } from 'react'
import { getBrowserId, getBrowserName, type DiscordUser } from '@/lib/auth'

export function useCurrentUser() {
    const [currentUser, setCurrentUser] = useState<DiscordUser | null>(null)

    useEffect(() => {
        // Generate/get browser ID and name
        const browserId = getBrowserId()
        const browserName = getBrowserName()

        if (browserId) {
            setCurrentUser({
                userId: browserId,
                username: browserName,
                avatar: null
            })
        }
    }, [])

    return currentUser
}

