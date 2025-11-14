# Discord.js Code Bin

A modern website to store one or more files of code relating to the [discord.js](https://discord.js.org) library, exemplifying suggestions and improvements according to the library's documentation and official guide.

## Features

### Code Analysis

When analyzing code, the system checks for numerous elements that may be considered problematic or differed from suggested usage based on the [discord.js guide](https://discordjs.guide). Some examples include primarily checking for intents that are differentiated based on the latest version of the library (e.g., SCREAMING_SNAKE_CASE to PascalCase) or intents that may be hard-coded using [magic numbers](<https://en.wikipedia.org/wiki/Magic_number*(programming)>).

In addition, it also checks for missing intents that may be required throughout the entire project such as the MessageContent intent when using the MessageCreate event.

Moreover, the system also provides relevant resources such as the [discord.js documentation](https://discord.js.org) or [discord.js guide](https://discordjs.guide) for extensive elaboration and clarification based on the issues present.

-   Real-time detection of common discord.js issues
-   Direct links to relevant resources such as the [discord.js documentation](https://discord.js.org) or suggestions based on the [discord.js guide](https://discord.js.guide)

**Code Sharing**

Similar to PasteBin or SourceBin, share your own project consisting of all imported files for others to see or review.

## Getting Started

### Prerequisites

-   Node.js 18+ installed
-   [`npm`](https://nodejs.org/en/download) or [`yarn`](https://yarnpkg.com) package manager

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

## Tech Stack

-   **Next.js v16** - React framework
-   **TypeScript** - Type safety
-   **Tailwind CSS v4** - Utility-first CSS framework
-   **DaisyUI 5** - Component library for Tailwind
-   **Monaco Editor** - VS Code's editor
-   **React** - The main framework based on top of Next.js

## Contributing

Contributions are wholeheartedly welcome! Feel free to [report bugs](https://github.com/joeyk710/discord.js-codebin/issues) or [suggest new implementations](https://github.com/joeyk710/discord.js-codebin/pulls/new).

## License

MIT

## Resources

-   [Discord.js Guide](https://discordjs.guide)
-   [Discord.js Documentation](https://discord.js.org)
-   [Discord.js GitHub](https://github.com/discordjs/discord.js)
