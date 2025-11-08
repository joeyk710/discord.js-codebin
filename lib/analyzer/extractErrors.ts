/**
 * Extract error codes and messages from discord.js source
 * Dynamically reads from the actual discord.js source files
 */

import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

export interface DiscordJSError {
  code: string
  pattern: string
  message: string
  source?: string
}

let cachedErrors: DiscordJSError[] | null = null
let cachedExamples: Map<string, string> | null = null

/**
 * Extract error messages from discord.js Messages.js file
 */
function extractFromMessagesFile(): DiscordJSError[] {
  try {
    const messagesPath = join(process.cwd(), 'node_modules', 'discord.js', 'src', 'errors', 'Messages.js')
    const content = readFileSync(messagesPath, 'utf-8')

    const regex = /\[DjsErrorCodes\.(\w+)\]:\s*(?:(\([^)]*\)\s*=>|'([^']*))|"([^"]*)")/g
    const errors: DiscordJSError[] = []
    let match

    while ((match = regex.exec(content)) !== null) {
      const codeName = match[1]
      const messageContent = match[3] || match[4] || ''

      errors.push({
        code: codeName,
        pattern: codeName,
        message: messageContent,
        source: 'Messages.js',
      })
    }

    return errors
  } catch (error) {
    console.warn('Failed to extract errors from Messages.js:', error)
    return []
  }
}

/**
 * Extract error handling and validation patterns from discord.js source code
 * Looks for common error throws and validation patterns
 */
function extractFromSourceFiles(): DiscordJSError[] {
  try {
    const errors: DiscordJSError[] = []
    const srcPath = join(process.cwd(), 'node_modules', 'discord.js', 'src')

    // Recursively find all TypeScript/JavaScript files
    function walkDir(dir: string): string[] {
      let files: string[] = []
      const entries = readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          files = files.concat(walkDir(fullPath))
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
          files.push(fullPath)
        }
      }
      return files
    }

    const files = walkDir(srcPath)

    // Extract validation and error patterns
    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8')

        // Find throw new Error patterns
        // Format: throw new Error('error message')
        const throwRegex = /throw new (?:Error|TypeError|RangeError)\(['"`]([^'"`]+)['"`]\)/g
        let match
        while ((match = throwRegex.exec(content)) !== null) {
          const errorMsg = match[1]
          const fileName = file.split('/').pop()
          errors.push({
            code: errorMsg.substring(0, 50), // Use message as code
            pattern: errorMsg,
            message: errorMsg,
            source: fileName,
          })
        }

        // Find validation checks
        // Format: if (!x) throw new Error
        const validateRegex = /if\s*\(\s*!(\w+)\s*\)\s*(?:throw|{[^}]*throw)/g
        while ((match = validateRegex.exec(content)) !== null) {
          const param = match[1]
          errors.push({
            code: `Invalid_${param}`,
            pattern: param,
            message: `${param} must be provided and valid`,
            source: file.split('/').pop(),
          })
        }
      } catch (err) {
        // Skip files that can't be read
      }
    }

    return errors
  } catch (error) {
    console.warn('Failed to extract from source files:', error)
    return []
  }
}

/**
 * Extract example code snippets from discord.js documentation comments
 */
function extractExamplesFromSource(): Map<string, string> {
  const examples = new Map<string, string>()

  try {
    const srcPath = join(process.cwd(), 'node_modules', 'discord.js', 'src')

    function walkDir(dir: string): string[] {
      let files: string[] = []
      const entries = readdirSync(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dir, entry.name)
        if (entry.isDirectory() && !entry.name.startsWith('.')) {
          files = files.concat(walkDir(fullPath))
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
          files.push(fullPath)
        }
      }
      return files
    }

    const files = walkDir(srcPath)

    for (const file of files) {
      try {
        const content = readFileSync(file, 'utf-8')

        // Extract JSDoc @example blocks
        const exampleRegex = /@example\s*\n\s*(?:\/\/\s*)?```(ts|js|typescript|javascript)?\n([\s\S]*?)\n\s*```/g
        let match
        while ((match = exampleRegex.exec(content)) !== null) {
          const code = match[2]
          const key = file.split('/').pop()!.replace(/\.(ts|js)$/, '')
          examples.set(key, code)
        }
      } catch (err) {
        // Skip files that can't be read
      }
    }
  } catch (error) {
    console.warn('Failed to extract examples:', error)
  }

  return examples
}

/**
 * Get all discord.js errors with caching
 * Combines errors from Messages.js and direct source analysis
 */
export function getAllErrors(): DiscordJSError[] {
  if (cachedErrors === null) {
    const fromMessages = extractFromMessagesFile()
    const fromSource = extractFromSourceFiles()
    // Merge and deduplicate by code
    const merged = new Map<string, DiscordJSError>()
    for (const err of [...fromMessages, ...fromSource]) {
      merged.set(err.code, err)
    }
    cachedErrors = Array.from(merged.values())
  }
  return cachedErrors
}

/**
 * Get example code snippets
 */
export function getExamples(): Map<string, string> {
  if (cachedExamples === null) {
    cachedExamples = extractExamplesFromSource()
  }
  return cachedExamples
}

/**
 * Check if code contains any discord.js errors
 * Only match when error patterns are directly mentioned in code
 */
export function findErrorsInCode(code: string): DiscordJSError[] {
  const foundErrors: DiscordJSError[] = []
  const seen = new Set<string>()

  const allErrors = getAllErrors()

  // Only match if the error code name is explicitly in the error message text
  // Don't try to fuzzy match - that causes false positives
  for (const error of allErrors) {
    if (seen.has(error.code)) continue

    // Match error code names ONLY when they appear in Error messages or throws
    // Format: throw new Error('ClientMissingIntents') or Error: ClientMissingIntents
    const errorCodeInText = new RegExp(`\\b${error.code}\\b`, 'i')
    if (errorCodeInText.test(code)) {
      foundErrors.push(error)
      seen.add(error.code)
    }
  }

  return foundErrors
}

/**
 * Generate suggestion from source - only suggest when we have real context
 * Don't show suggestions for generic errors without specific code patterns
 */
export function getSuggestionForError(error: DiscordJSError): string {
  const { code, message } = error

  // First check: if we have a good error message from discord.js source, use it
  if (message && message.length > 10) {
    return `**${code}**\n\n${message}\n\n[Discord.js Documentation](https://discord.js.org/docs)`
  }

  // Context-specific suggestions based on error code
  const suggestions: Record<string, string> = {
    // Client/Auth errors
    ClientMissingIntents: `**Missing Intents**\n\nYou must provide intents when creating the Client:\n\n\`\`\`typescript\nconst client = new Client({\n  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],\n});\n\`\`\``,

    ClientNotReady: `**Client Not Ready**\n\nWait for the 'ready' event before using client methods:\n\n\`\`\`typescript\nclient.on('ready', () => {\n  console.log('Ready as', client.user.tag);\n});\n\`\`\``,

    TokenInvalid: `**Invalid Token**\n\nRegenarate your token from [Discord Developer Portal](https://discord.com/developers/applications).`,

    TokenMissing: `**Missing Token**\n\nCall \`client.login()\` with your token:\n\n\`\`\`typescript\nclient.login(process.env.DISCORD_TOKEN);\n\`\`\``,

    // Interaction errors
    InteractionAlreadyReplied: `**Interaction Already Replied**\n\nCheck if already replied before responding:\n\n\`\`\`typescript\nif (!interaction.replied && !interaction.deferred) {\n  await interaction.reply('...');\n} else {\n  await interaction.editReply('...');\n}\n\`\`\``,

    // Builder/Component errors - only show if explicitly mentioned
    ButtonLabel: `**Button Missing Label**\n\n\`\`\`typescript\nnew ButtonBuilder().setLabel('Click me!');\n\`\`\``,

    ButtonCustomId: `**Button Missing Custom ID**\n\n\`\`\`typescript\nnew ButtonBuilder().setCustomId('my_button');\n\`\`\``,

    SelectMenuCustomId: `**Select Menu Missing Custom ID**\n\n\`\`\`typescript\nnew StringSelectMenuBuilder().setCustomId('my_menu');\n\`\`\``,
  }

  // Return specific suggestion if available
  if (suggestions[code]) {
    return suggestions[code]
  }

  // Generic fallback with the actual error message
  return `**${code}**\n\n${message || 'Check the discord.js documentation.'}\n\n[Discord.js Docs](https://discord.js.org/docs)`
}
