import type { Suggestion } from '../types'

/**
 * Simplified IntentsDetector - checks for critical intent configuration issues
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
\`\`\``,
        severity: 'high',
        line: lineNum,
        docLink: 'https://discord.js.org/docs/packages/discord.js/main/GatewayIntentBits:enum',
      })
    }

    return suggestions
  }
}
