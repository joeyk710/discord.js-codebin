export default function Footer() {
  return (
    <footer className="footer bg-base-200 text-base-content border-t border-base-300 pt-2 pb-2 px-3 sm:px-6 flex-shrink-0">
      <div className="w-full">
        {/* Main content grid - collapsed on mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm">
          {/* Branding section - hidden on mobile */}
          <div className="hidden sm:flex flex-col items-start sm:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <img
                src="https://cdn.discordapp.com/avatars/348607796335607817/2d72562153c202e77c681f2a7efbe919.png?size=2048"
                alt="Discord.js"
                className="w-8 h-8 rounded-lg shadow-lg"
              />
            </div>
            <p className="text-xs text-base-content/70">
              A platform for discord.js developers to share, review, and learn from code snippets.
            </p>
          </div>

          {/* Resources section */}
          <nav className="flex flex-col gap-2 sm:gap-3">
            <h6 className="footer-title text-xs font-bold uppercase tracking-wide">Resources</h6>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <a href="https://discord.js.org" target="_blank" rel="noopener noreferrer" className="link link-hover">
                  Docs
                </a>
              </li>
              <li>
                <a href="https://discordjs.guide" target="_blank" rel="noopener noreferrer" className="link link-hover">
                  Guide
                </a>
              </li>
              <li>
                <a href="https://discord.com/developers" target="_blank" rel="noopener noreferrer" className="link link-hover">
                  Portal
                </a>
              </li>
            </ul>
          </nav>

          {/* Community section */}
          <nav className="flex flex-col gap-2 sm:gap-3">
            <h6 className="footer-title text-xs font-bold uppercase tracking-wide">Community</h6>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <a href="https://discord.gg/djs" target="_blank" rel="noopener noreferrer" className="link link-hover">
                  Discord
                </a>
              </li>
              <li>
                <a href="https://github.com/discordjs/discord.js" target="_blank" rel="noopener noreferrer" className="link link-hover">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://stackoverflow.com/questions/tagged/discord.js" target="_blank" rel="noopener noreferrer" className="link link-hover">
                  SO
                </a>
              </li>
            </ul>
          </nav>

          {/* Legal section */}
          <nav className="flex flex-col gap-2 sm:gap-3">
            <h6 className="footer-title text-xs font-bold uppercase tracking-wide">Legal</h6>
            <ul className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
              <li>
                <a href="https://discord.com/terms" target="_blank" rel="noopener noreferrer" className="link link-hover">
                  Terms
                </a>
              </li>
              <li>
                <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer" className="link link-hover">
                  Privacy
                </a>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="link link-hover text-xs sm:text-sm">
                  Open Source
                </a>
              </li>
            </ul>
          </nav>
        </div>

        {/* Divider */}
        <div className="divider my-1"></div>

        {/* Bottom bar */}
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-2 text-xs text-base-content/50 text-center md:text-left">
          <p>Built with ❤️ for discord.js developers</p>
        </div>
      </div>
    </footer>
  )
}
