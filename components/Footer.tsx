export default function Footer() {
  return (
    <>
      {/* Mobile collapsible footer */}
      <div className="md:hidden">
        <div className="collapse collapse-arrow bg-base-100">
          <input type="checkbox" defaultChecked={false} />
          <div className="collapse-title flex items-center justify-between px-4 py-3 font-semibold">
            <div className="flex items-center gap-2">
              <img src="/djs.png" alt="djs" className="w-6 h-6 rounded" />
              <span>More Info</span>
            </div>
          </div>
          <div className="collapse-content">
            <footer className="footer footer-vertical bg-base-100 text-base-content p-4 gap-4">
              {/* Logo and branding section */}
              <aside>
                <div className="flex items-center gap-2 mb-2">
                  <img
                    src="/djs.png"
                    alt="discord.js"
                    className="w-8 h-8 rounded-lg"
                  />
                </div>
                <p className="text-xs font-semibold">discord.js Code Bin</p>
                <p className="text-xs text-base-content/60 max-w-xs">
                  Share, analyze, and review discord.js code snippets with syntax highlighting.
                </p>
              </aside>

              {/* Services section */}
              <nav>
                <h6 className="footer-title text-xs">Services</h6>
                <div className="flex flex-col gap-2">
                  <a href="https://discord.js.org" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
                    discord.js Documentation
                  </a>
                  <a href="https://discordjs.guide" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
                    discord.js Guide
                  </a>
                  <a href="https://discord.gg/djs" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
                    Discord Server
                  </a>
                </div>
              </nav>

              {/* Company section */}
              <nav>
                <h6 className="footer-title text-xs">Company</h6>
                <div className="flex flex-col gap-2">
                  <a href="https://github.com/joeyk710/discord.js-codebin" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
                    GitHub
                  </a>
                  <a href="https://github.com/joeyk710/discord.js-codebin/issues" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
                    Report Issues
                  </a>
                </div>
              </nav>

              {/* Legal section */}
              <nav>
                <h6 className="footer-title text-xs">Legal</h6>
                <div className="flex flex-col gap-2">
                  <a href="/privacy" className="link link-hover text-sm">
                    Privacy & Analytics
                  </a>
                </div>
              </nav>
            </footer>
          </div>
        </div>
      </div>

      {/* Desktop footer */}
      <footer className="hidden md:flex footer footer-horizontal bg-base-100 text-base-content p-10 flex-shrink-0 gap-20">
        {/* Logo and branding section */}
        <aside>
          <div className="flex items-center gap-2 mb-3">
            <img
              src="/djs.png"
              alt="discord.js"
              className="w-12 h-12 rounded-lg"
            />
          </div>
          <p className="text-sm font-semibold">discord.js Code Bin</p>
          <p className="text-xs text-base-content/60 max-w-xs">
            Share, analyze, and review discord.js code snippets with and syntax highlighting.
          </p>
        </aside>

        {/* Services section */}
        <nav>
          <h6 className="footer-title text-sm">Community</h6>
          <div className="flex flex-col gap-2">
            <a href="https://discord.js.org" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
              discord.js Documentation
            </a>
            <a href="https://discordjs.guide" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
              discord.js Guide
            </a>
            <a href="https://discord.gg/djs" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
              Discord Server
            </a>
          </div>
        </nav>

        {/* Company section */}
        <nav>
          <h6 className="footer-title text-sm">Project</h6>
          <div className="flex flex-col gap-2">
            <a href="https://github.com/joeyk710/discord.js-codebin" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
              GitHub
            </a>
            <a href="https://github.com/joeyk710/discord.js-codebin/issues" target="_blank" rel="noopener noreferrer" className="link link-hover text-sm">
              Report Issues
            </a>
          </div>
        </nav>

        {/* Legal section */}
        <nav>
          <h6 className="footer-title text-sm">Legal</h6>
          <div className="flex flex-col gap-2">
            <a href="/privacy" className="link link-hover text-sm">
              Privacy & Analytics
            </a>
          </div>
        </nav>
      </footer>
    </>
  )
}
