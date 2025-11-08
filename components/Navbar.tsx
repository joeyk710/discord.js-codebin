'use client'

interface NavbarProps {
    onNew: () => void
    onSaveShare: () => void
    isSaving: boolean
}

export default function Navbar({ onNew, onSaveShare, isSaving }: NavbarProps) {
    return (
        <div className="navbar bg-base-100 flex-shrink-0 shadow-sm rounded-t-2xl flex-wrap gap-2 p-2 sm:p-4">
            <div className="navbar-start w-full sm:w-auto">
                <div className="flex items-center gap-2 sm:gap-3">
                    <img
                        src="https://cdn.discordapp.com/avatars/348607796335607817/2d72562153c202e77c681f2a7efbe919.png?size=2048"
                        alt="discord.js"
                        className="w-8 sm:w-10 h-8 sm:h-10 rounded-lg"
                    />
                    <div className="hidden sm:block">
                        <h1 className="text-lg sm:text-xl font-bold text-base-content">discord.js Code Bin</h1>
                        <p className="text-xs text-base-content/60">Code review, analysis & sharing</p>
                    </div>
                    <div className="sm:hidden">
                        <h1 className="text-sm font-bold text-base-content">DJS Code Bin</h1>
                    </div>
                </div>
            </div>
        </div>
    )
}
