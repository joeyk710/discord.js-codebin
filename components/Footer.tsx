export default function Footer() {
  return (
    <footer className="footer footer-vertical sm:footer-horizontal bg-base-100 text-base-content border-t border-base-300 p-4 sm:p-10 flex-shrink-0 gap-4 sm:gap-8">
      {/* Logo and branding section */}
      <aside>
        <div className="flex items-center gap-2 mb-3">
          <img
            src="/djs.png"
            alt="discord.js"
            className="w-10 sm:w-12 h-10 sm:h-12 rounded-lg"
          />
        </div>
        <p className="text-xs sm:text-sm font-semibold">discord.js Code Bin</p>
        <p className="text-xs text-base-content/60 max-w-xs">
          Share, analyze, and review discord.js code snippets with intelligent suggestions and syntax highlighting.
        </p>
      </aside>

      {/* Services section */}
      <nav>
        <h6 className="footer-title text-xs sm:text-sm">Services</h6>
        <div className="flex flex-col gap-2">
          <a href="https://discord.js.org" target="_blank" rel="noopener noreferrer" className="link link-hover text-xs sm:text-sm">
            discord.js Documentation
          </a>
          <a href="https://discordjs.guide" target="_blank" rel="noopener noreferrer" className="link link-hover text-xs sm:text-sm">
            discord.js Guide
          </a>
          <a href="https://discord.com/developers" target="_blank" rel="noopener noreferrer" className="link link-hover text-xs sm:text-sm">
            Discord Developer Portal
          </a>
        </div>
      </nav>

      {/* Company section */}
      <nav>
        <h6 className="footer-title text-xs sm:text-sm">Company</h6>
        <div className="flex flex-col gap-2">
          <a href="https://github.com/joeyk710/discord-js-codebin" target="_blank" rel="noopener noreferrer" className="link link-hover text-xs sm:text-sm">
            GitHub
          </a>
          <a href="https://discord.gg/djs" target="_blank" rel="noopener noreferrer" className="link link-hover text-xs sm:text-sm">
            Discord Community
          </a>
          <a href="https://github.com/discordjs/discord.js/issues" target="_blank" rel="noopener noreferrer" className="link link-hover text-xs sm:text-sm">
            Report Issues
          </a>
        </div>
      </nav>

      {/* Legal section */}
      <nav>
        <h6 className="footer-title text-xs sm:text-sm">Legal</h6>
        <div className="flex flex-col gap-2">
          <a href="https://discord.com/terms" target="_blank" rel="noopener noreferrer" className="link link-hover text-xs sm:text-sm">
            Terms of Service
          </a>
          <a href="https://discord.com/privacy" target="_blank" rel="noopener noreferrer" className="link link-hover text-xs sm:text-sm">
            Privacy Policy
          </a>
          <a href="https://github.com/discordjs/discord.js/blob/main/LICENSE" target="_blank" rel="noopener noreferrer" className="link link-hover text-xs sm:text-sm">
            License
          </a>
        </div>
      </nav>
    </footer>
  )
}
