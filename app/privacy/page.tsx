"use client"

import React, { useEffect, useState } from "react"
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function PrivacyPage() {
    // null = undecided, true = granted, false = denied
    const [analytics, setAnalytics] = useState<boolean | null>(null)

    useEffect(() => {
        try {
            const stored = localStorage.getItem("analytics-consent")
            if (stored === "granted") setAnalytics(true)
            else if (stored === "denied") setAnalytics(false)
            else setAnalytics(null)
        } catch (e) {
            setAnalytics(null)
        }
    }, [])

    const toggle = (value: boolean) => {
        try {
            localStorage.setItem("analytics-consent", value ? "granted" : "denied")
        } catch (e) { }
        setAnalytics(value)
    }

    return (
        <div className="flex flex-col min-h-screen bg-base-100">
            <Navbar />

            <main className="flex-1 m-6">
                <header className="mb-6">
                    <h1 className="text-3xl font-extrabold">Privacy & Analytics</h1>
                    <p className="text-base-content/70 mt-2">Manage how we collect and use data to improve your experience</p>
                </header>

                <div className="space-y-6">
                    <section className="rounded-lg border border-base-300 bg-base-100 p-6">
                        <div className="flex items-start justify-between gap-6">
                            <div className="flex-1">
                                <h2 className="text-xl font-semibold">Analytics & Performance</h2>
                                <p className="text-sm text-base-content/70 mt-2">Analytics are enabled. We use your data to improve the experience.</p>
                            </div>

                            <div className="flex items-center">
                                <span className="text-sm mr-3">Analytics & Performance Tracking</span>

                                <label className="toggle text-base-content">
                                    <input
                                        type="checkbox"
                                        checked={analytics === true}
                                        onChange={(e) => toggle(e.target.checked)}
                                        aria-checked={analytics === true}
                                        aria-label={analytics === true ? 'enabled' : 'disabled'}
                                    />

                                    {/* disabled icon (left) */}
                                    <svg aria-hidden={analytics === true} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4">
                                        <path d="M18 6 6 18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                        <path d="m6 6 12 12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                                    </svg>

                                    {/* enabled icon (right) */}
                                    <svg aria-hidden={analytics !== true} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4">
                                        <g
                                            strokeLinejoin="round"
                                            strokeLinecap="round"
                                            strokeWidth="4"
                                            fill="none"
                                            stroke="currentColor"
                                        >
                                            <path d="M20 6 9 17l-5-5"></path>
                                        </g>
                                    </svg>
                                </label>
                            </div>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="rounded-lg border border-base-300 bg-base-100 p-6">
                            <h3 className="font-semibold mb-4">What We Collect</h3>
                            <ul className="list-disc pl-5 text-sm space-y-2 text-base-content/80">
                                <li><strong>Page views</strong> — Which pages you visit</li>
                                <li><strong>Performance</strong> — How fast our site loads</li>
                                <li><strong>Interactions</strong> — Which features you use</li>
                                <li><strong>Browser info</strong> — Device type and OS</li>
                            </ul>
                        </div>

                        <div className="rounded-lg border border-base-300 bg-base-100 p-6">
                            <h3 className="font-semibold mb-4">How We Use Data</h3>
                            <ul className="list-disc pl-5 text-sm space-y-2 text-base-content/80">
                                <li>Improve performance and fix issues</li>
                                <li>Understand which features are useful</li>
                                <li>Identify technical problems</li>
                                <li>Enhance your overall experience</li>
                            </ul>
                        </div>
                    </section>

                    <section className="rounded-lg border border-base-300 bg-base-100 p-6">
                        <h3 className="font-semibold mb-4">Your Privacy Matters</h3>
                        <p className="text-sm text-base-content/80 mb-4">
                            We never sell your data to third parties. Analytics are only used internally to improve our service. You can disable analytics at any time from this page, and your preference will be saved in your browser for one year.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="rounded-md p-4 border border-base-200 bg-base-200">
                                <div className="text-sm font-semibold">Your preference is stored locally</div>
                            </div>

                            <div className="rounded-md p-4 border border-base-200 bg-base-200">
                                <div className="text-sm font-semibold">No account or login required</div>
                            </div>

                            <div className="rounded-md p-4 border border-base-200 bg-base-200">
                                <div className="text-sm font-semibold">You can change your mind anytime</div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    )
}
