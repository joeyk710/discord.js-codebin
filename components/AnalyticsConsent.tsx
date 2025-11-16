"use client"

import React, { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'

export default function AnalyticsConsent() {
    // undefined = not-yet-read (don't render anything)
    // null = user hasn't decided (show prompt)
    // true/false = user's choice
    const [consent, setConsent] = useState<boolean | null | undefined>(undefined)

    useEffect(() => {
        try {
            const stored = localStorage.getItem('analytics-consent')
            if (stored === 'granted') setConsent(true)
            else if (stored === 'denied') setConsent(false)
            else setConsent(null)
        } catch (e) {
            setConsent(null)
        }
    }, [])

    const accept = () => {
        try {
            localStorage.setItem('analytics-consent', 'granted')
        } catch (e) { }
        setConsent(true)
    }

    const deny = () => {
        try {
            localStorage.setItem('analytics-consent', 'denied')
        } catch (e) { }
        setConsent(false)
    }

    return (
        <>
            {consent === true && <Analytics />}

            {/* only show the prompt when we've read storage and it's explicitly undecided (null) */}
            {consent === null && (
                <div className="fixed right-4 bottom-4 z-50 max-w-xs w-full bg-base-200 border border-base-300/60 text-base-content/90 rounded-lg shadow-lg p-3">
                    <div className="flex items-start gap-3">
                        <div className="flex-1 text-sm">
                            <div className="font-semibold">Analytics</div>
                            <div className="text-xs text-base-content/70">
                                We use Vercel Web Analytics to collect anonymous usage data to improve this site. No personal data is stored.
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <button onClick={accept} className="btn btn-xs btn-primary rounded-md">Accept</button>
                            <button onClick={deny} className="btn btn-xs btn-ghost rounded-md">No thanks</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
