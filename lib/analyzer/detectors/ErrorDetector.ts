import type { Suggestion } from '../types'

/**
 * ErrorDetector - identifies common discord.js errors and best practices
 */
export class ErrorDetector {
  name = 'ErrorDetector'

  detect(code: string): Suggestion[] {
    const suggestions: Suggestion[] = []
    const lines = code.split('\n')

    // Check for missing error handlers
    if (code.includes('client.on') && !code.includes("client.on('error'")) {
      suggestions.push({
        type: 'warning',
        message: 'Missing error event handler',
        details: `Add error handling to prevent unhandled rejections:
\`\`\`typescript
client.on('error', error => {
  console.error('Client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});
\`\`\``,
        severity: 'high',
        docLink: 'https://discord.js.org/docs/packages/discord.js/main/Client:class',
      })
    }

    // Check for deprecated old command handler patterns
    if (code.includes('client.commands') && !code.includes('Collection')) {
      suggestions.push({
        type: 'info',
        message: 'Consider using Discord.js Collection for command storage',
        details: `Use Collection for storing commands:
\`\`\`typescript
import { Collection } from 'discord.js';

client.commands = new Collection();
\`\`\``,
        severity: 'medium',
        docLink: 'https://discord.js.org/docs/packages/discord.js/main/Collection:class',
      })
    }

    return suggestions
  }
}
