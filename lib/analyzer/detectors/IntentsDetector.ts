import type { Suggestion } from '../types'
import { getDiscordMetadata } from '../discordMetadata'

const discordMeta = getDiscordMetadata()
const availableIntents = new Set(discordMeta.gatewayIntents)
const privilegedIntents = new Set(
  ['MessageContent', 'GuildMembers', 'GuildPresences'].filter(intent => availableIntents.has(intent))
)
const versionLabel = discordMeta.version ?? 'latest'

/**
 * IntentsDetector - checks for critical intent configuration issues and privileged intents
 */
export class IntentsDetector {
  name = 'IntentsDetector'

  detect(code: string): Suggestion[] {
    const suggestions: Suggestion[] = []
    const lines = code.split('\n')

    const importsDiscordJs = /from\s+['"]discord\.js['"]/.test(code)
    const hasGatewayIntentImport = importsDiscordJs && /\bGatewayIntentBits\b/.test(code)

    const docLinks = {
      client: `https://discord.js.org/docs/packages/discord.js/${versionLabel}/Client:class`,
      intents: `https://discord.js.org/docs/packages/discord.js/${versionLabel}/GatewayIntentBits:enum`,
    }

    const shouldWarnForIntent = (intentName: string) =>
      privilegedIntents.size === 0 || privilegedIntents.has(intentName)

    const clientCtorMatch = /new\s+Client\s*\(\s*\{([\s\S]*?)\}\s*\)/m.exec(code)
    const clientHasIntents = !!(clientCtorMatch && /\bintents\s*:/.test(clientCtorMatch[1]))

    if (code.includes('new Client') && !clientHasIntents) {
      const lineNum = lines.findIndex(line => line.includes('new Client')) + 1
      suggestions.push({
        type: 'error',
        message: 'Client created without intents',
        details: `Add intents when creating a Client instance:
\`\`\`typescript
import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // Required to read message.content
  ],
});
\`\`\``,
        severity: 'critical',
        line: lineNum,
        docLink: docLinks.client,
      })
    }

    if (
      code.includes('message.content') &&
      !(hasGatewayIntentImport && /MessageContent/.test(code)) &&
      shouldWarnForIntent('MessageContent')
    ) {
      const lineNum = lines.findIndex(line => line.includes('message.content')) + 1
      suggestions.push({
        type: 'warning',
        message: 'Accessing message.content without MessageContent intent',
        details: `Add GatewayIntentBits.MessageContent to your client intents:
\`\`\`typescript
intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent, // <- Add this
],
\`\`\`

**Note**: MessageContent is a privileged intent. Enable it in the Discord Developer Portal under Bot → Privileged Gateway Intents.`,
        severity: 'high',
        line: lineNum,
        docLink: docLinks.intents,
      })
    }

    if (
      (code.includes('guild.members') || code.includes('guildMember')) &&
      !(hasGatewayIntentImport && /GuildMembers/.test(code)) &&
      shouldWarnForIntent('GuildMembers')
    ) {
      const lineNum = lines.findIndex(line => line.includes('guild.members') || line.includes('guildMember')) + 1
      suggestions.push({
        type: 'warning',
        message: 'Accessing guild members without GuildMembers intent',
        details: `Add GatewayIntentBits.GuildMembers to your client intents:
\`\`\`typescript
intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMembers, // <- Add this for member events
],
\`\`\`

**Note**: GuildMembers is a privileged intent. Enable it in Discord Developer Portal.`,
        severity: 'high',
        line: lineNum,
        docLink: docLinks.intents,
      })
    }

    if (
      (code.includes('presence') || code.includes('.status')) &&
      !(hasGatewayIntentImport && /GuildPresences/.test(code)) &&
      shouldWarnForIntent('GuildPresences')
    ) {
      const lineNum = lines.findIndex(line => line.includes('presence') || line.includes('.status')) + 1
      suggestions.push({
        type: 'warning',
        message: 'Accessing presence data without GuildPresences intent',
        details: `Add GatewayIntentBits.GuildPresences to your client intents:
\`\`\`typescript
intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildPresences, // <- Add this for presence data
],
\`\`\`

**Note**: GuildPresences is a privileged intent. Enable it in Discord Developer Portal.`,
        severity: 'high',
        line: lineNum,
        docLink: docLinks.intents,
      })
    }

    const intentsArrayMatch = /intents\s*:\s*\[([\s\S]*?)\]/m.exec(code)
    if (intentsArrayMatch) {
      const literalMatches = Array.from(intentsArrayMatch[1].matchAll(/['"`]([^'"`]+)['"`]/g)).map(match => match[1])
      const legacyStrings = literalMatches.filter(literal => literal === literal.toUpperCase())
      const camelCaseIntents = literalMatches.filter(literal => availableIntents.has(literal))

      if (legacyStrings.length > 0 || camelCaseIntents.length > 0) {
        const lineNum = lines.findIndex(line => line.includes('intents:')) + 1
        suggestions.push({
          type: 'warning',
          message: 'Using deprecated string-based intents',
          details: `Use GatewayIntentBits enum instead of string literals:
\`\`\`typescript
// ❌ Old way (deprecated)
intents: ['GUILDS', 'GUILD_MESSAGES']

// ✅ discord.js ${versionLabel}
intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
\`\`\``,
          severity: 'medium',
          line: lineNum,
          docLink: docLinks.intents,
        })
      }
    }

    return suggestions
  }
}
