export default function Footer() {
  return (
    <footer className="footer bg-base-200 text-base-content border-t border-base-300 pt-2 pb-4 px-6">
      <div className="w-full max-w-7xl mx-auto">
        {/* Main content grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
          {/* Branding section */}
          <div className="flex flex-col items-start md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="https://cdn.discordapp.com/avatars/348607796335607817/2d72562153c202e77c681f2a7efbe919.png?size=2048"
                alt="Discord.js"
                className="w-12 h-12 rounded-lg shadow-lg"
              />
            </div>
            <p className="text-sm text-base-content/70">
              A platform for discord.js developers to share, review, and learn from code snippets.
            </p>
          </div>

          {/* Resources section */}
          <nav className="flex flex-col gap-3">
            <h6 className="footer-title text-xs font-bold uppercase tracking-wide">Resources</h6>
            <ul className="space-y-2">
              <li>
                <a href="https://discord.js.org" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
                  discord.js Docs
                </a>
              </li>
              <li>
                <a href="https://discordjs.guide" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
                  discord.js Guide
                </a>
              </li>
              <li>
                <a href="https://discord.com/developers" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
                  Developer Portal
                </a>
              </li>
            </ul>
          </nav>

          {/* Community section */}
          <nav className="flex flex-col gap-3">
            <h6 className="footer-title text-xs font-bold uppercase tracking-wide">Community</h6>
            <ul className="space-y-2">
              <li>
                <a href="https://discord.gg/djs" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
                  Discord Server
                </a>
              </li>
              <li>
                <a href="https://github.com/discordjs/discord.js" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://stackoverflow.com/questions/tagged/discord.js" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
                  Stack Overflow
                </a>
              </li>
            </ul>
          </nav>

          {/* Legal section */}
          <nav className="flex flex-col gap-3">
            <h6 className="footer-title text-xs font-bold uppercase tracking-wide">Legal</h6>
            <ul className="space-y-2">
              <li>
                <a href="https://discord.com/terms" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
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
