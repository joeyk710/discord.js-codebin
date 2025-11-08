# Discord.js Code Editor

A modern web-based code editor for Discord.js with intelligent suggestions and documentation integration, similar to SourceBin and Pastebin.

## Features

✨ **Monaco Editor Integration**

- Full-featured code editor with syntax highlighting
- Auto-completion and IntelliSense
- Dark theme optimized for coding

🎨 **DaisyUI Theming**

- Multiple dark themes (Dark, Dracula, Night, Coffee, Business, Synthwave, Halloween, Forest)
- Easy theme switching with persistence
- Beautiful, accessible UI components

🔍 **Intelligent Code Analysis**

- Real-time detection of common Discord.js issues
- Suggestions based on [discord.js guide](https://discordjs.guide)
- Automatic linking to relevant documentation

📚 **Documentation Integration**

- Direct links to [discord.js.org](https://discord.js.org) documentation
- Property and method suggestions
- Best practices from the official guide

💾 **Code Sharing**

- Save and share code snippets with unique URLs
- Simple paste/bin functionality
- Easy collaboration and code review

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Writing Code

1. Type or paste your Discord.js code in the editor
2. The analyzer will automatically detect issues and provide suggestions
3. Click on suggestion links to view relevant documentation

### Saving & Sharing

1. Click the "Save & Share" button
2. Your code will be saved and a unique URL will be generated
3. Share the URL with others to collaborate

### Common Suggestions

The analyzer detects:

- Missing or incorrect intents
- Deprecated API usage
- Missing privileged intent warnings
- Improper error handling
- Missing imports
- Best practice violations

## Project Structure

```
djs-editor/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes
│   │   └── paste/           # Paste storage endpoints
│   ├── paste/[id]/          # Dynamic paste viewer
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Home page
├── components/              # React components
│   ├── CodeEditor.tsx       # Monaco editor wrapper
│   ├── EditorPage.tsx       # Main editor page
│   └── SuggestionsPanel.tsx # Suggestions sidebar
├── lib/                     # Utilities
│   └── analyzer.ts          # Code analysis logic
└── data/                    # Stored pastes (gitignored)
```

## Technologies Used

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Utility-first CSS framework
- **DaisyUI 5** - Component library for Tailwind
- **Monaco Editor** - VS Code's editor
- **React** - UI library
- **Nanoid** - Unique ID generation

## Analysis Rules

The code analyzer checks for:

1. **Intents Issues**

   - Old string-based intents (pre-v13)
   - Missing intents in Client constructor
   - MessageContent privileged intent usage

2. **Deprecated Patterns**

   - Old event handler patterns
   - Deprecated fetch methods
   - Legacy WebSocket options

3. **Best Practices**
   - Error handling for login
   - Proper imports from discord.js
   - Collection usage
   - GatewayIntentBits usage

## Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest new features
- Add more analysis rules
- Improve documentation links

## License

MIT

## Resources

- [Discord.js Guide](https://discordjs.guide)
- [Discord.js Documentation](https://discord.js.org)
- [Discord.js GitHub](https://github.com/discordjs/discord.js)
