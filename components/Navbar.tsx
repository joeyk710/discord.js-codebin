'use client'

import ThemeSwitcher from './ThemeSwitcher'

interface NavbarProps {
    onNew: () => void
    onSaveShare: () => void
    isSaving: boolean
}

export default function Navbar({ onNew, onSaveShare, isSaving }: NavbarProps) {
    return (
        <div className="navbar bg-base-100 flex-shrink-0 shadow-sm rounded-t-2xl">
            <div className="navbar-start">
                <div className="flex items-center gap-3">
                    <img
                        src="https://cdn.discordapp.com/avatars/348607796335607817/2d72562153c202e77c681f2a7efbe919.png?size=2048"
                        alt="discord.js"
                        className="w-10 h-10 rounded-lg"
                    />
                    <div>
                        <h1 className="text-xl font-bold text-base-content">discord.js Code Bin</h1>
                        <p className="text-xs text-base-content/60">Code review, analysis & sharing</p>
                    </div>
                </div>
            </div>

            <div className="navbar-center">
            </div>

            <div className="navbar-end gap-4 flex items-center">
                <button
                    onClick={onNew}
                    className="btn btn-sm btn-ghost rounded-xl"
                    title="Create new code snippet"
                >
                    ➕ New
                </button>
                <button
                    onClick={onSaveShare}
                    disabled={isSaving}
                    className="btn btn-sm btn-primary rounded-xl"
                    title="Save and share your code"
                >
                    {isSaving ? '⏳ Saving...' : '💾 Save & Share'}
                </button>
                <ThemeSwitcher />
            </div>
        </div>
    )
}
