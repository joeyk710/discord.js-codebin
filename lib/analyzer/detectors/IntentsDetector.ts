import type { Suggestion } from '../types'

/**
 * IntentsDetector - checks for critical intent configuration issues and privileged intents
 */
export class IntentsDetector {
  name = 'IntentsDetector'

  detect(code: string): Suggestion[] {
    const suggestions: Suggestion[] = []
    const lines = code.split('\n')

    // Check for missing intents when creating Client
    if (code.includes('new Client') && !code.includes('intents:')) {
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
        docLink: 'https://discord.js.org/docs/packages/discord.js/main/Client:class',
      })
    }

    // Check for MessageContent intent when accessing message.content
    if (code.includes('message.content') && !code.includes('MessageContent')) {
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
        docLink: 'https://discord.js.org/docs/packages/discord.js/main/GatewayIntentBits:enum',
      })
    }

    // Check for GuildMembers intent when accessing member-related properties
    if ((code.includes('guild.members') || code.includes('guildMember')) && !code.includes('GuildMembers')) {
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
        docLink: 'https://discord.js.org/docs/packages/discord.js/main/GatewayIntentBits:enum',
      })
    }

    // Check for GuildPresences intent when accessing presence data
    if ((code.includes('presence') || code.includes('.status')) && !code.includes('GuildPresences')) {
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
        docLink: 'https://discord.js.org/docs/packages/discord.js/main/GatewayIntentBits:enum',
      })
    }

    // Check for old string-based intents
    if (code.includes('intents: [') && /intents:\s*\[['"`]/.test(code)) {
      const lineNum = lines.findIndex(line => line.includes('intents:')) + 1
      suggestions.push({
        type: 'warning',
        message: 'Using deprecated string-based intents',
        details: `Use GatewayIntentBits enum instead of strings:
\`\`\`typescript
// ❌ Old way (deprecated)
intents: ['GUILDS', 'GUILD_MESSAGES']

// ✅ New way (v14+)
intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
\`\`\``,
        severity: 'medium',
        line: lineNum,
        docLink: 'https://discord.js.org/docs/packages/discord.js/main/GatewayIntentBits:enum',
      })
    }

    return suggestions
  }
}
