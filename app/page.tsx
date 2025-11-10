'use client'

import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ThemeSwitcher from '@/components/ThemeSwitcher'

export default function Home() {
  const router = useRouter()

  return (
    <div className="flex flex-col min-h-screen bg-base-100">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="text-center max-w-xl">
          {/* Logo & Title */}
          <div className="mb-8">
            <img
              src="/djs.png"
              alt="discord.js"
              className="w-16 h-16 rounded-lg mx-auto mb-4"
            />
            <h1 className="text-5xl sm:text-6xl font-bold text-base-content mb-2">
              discord.js Code Bin
            </h1>
            <p className="text-base-content/60 text-lg">
              Share and manage your discord.js code
            </p>
          </div>

          {/* Main CTA */}
          <button
            onClick={() => router.push('/editor')}
            className="btn btn-primary btn-lg rounded-xl mb-8 w-full sm:w-auto"
          >
            Start Editing
          </button>

          {/* Theme Switcher */}
          <div className="flex justify-center gap-2">
            <ThemeSwitcher />
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

