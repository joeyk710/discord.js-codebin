import type { Suggestion } from '../types'
import { getDocLink, isComponentBuilder } from '../discordMetadata'

/**
 * BestPracticesDetector - suggests Discord.js best practices and modern patterns
 */
export class BestPracticesDetector {
  name = 'BestPracticesDetector'

  detect(code: string): Suggestion[] {
    const suggestions: Suggestion[] = []
    const lines = code.split('\n')

    // Check for fetch operations without caching
    if ((code.includes('.fetch(') || code.includes('.fetchWebhook')) && !code.includes('.cache')) {
      suggestions.push({
        type: 'info',
        message: 'Consider using cache before fetching from API',
        details: `Check cache first to reduce API calls:
\`\`\`typescript
// Check cache first
let guild = client.guilds.cache.get(guildId);
if (!guild) {
  guild = await client.guilds.fetch(guildId);
}

// Or use .resolve() which checks cache automatically
const guild = await client.guilds.resolve(guildId);
\`\`\``,
        severity: 'low',
        docLink: getDocLink('BaseManager'),
      })
    }

    // Check for permission checks
    if (code.includes('message.member') || code.includes('interaction.member')) {
      if (!code.includes('permissions') && !code.includes('hasPermission')) {
        suggestions.push({
          type: 'info',
          message: 'Consider checking permissions before executing commands',
          details: `Verify user permissions to prevent unauthorized actions:
\`\`\`typescript
import { PermissionFlagsBits } from 'discord.js';

// Check if member has permission
if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
  return interaction.reply({
    content: 'You need Manage Messages permission!',
    ephemeral: true
  });
}
\`\`\``,
          severity: 'low',
          docLink: getDocLink('PermissionFlagsBits', 'discord.js', 'enum'),
        })
      }
    }

    // Check for ephemeral responses in error handling
    if (code.includes('interaction.reply') && code.includes('error')) {
      if (!code.includes('ephemeral: true')) {
        suggestions.push({
          type: 'info',
          message: 'Consider using ephemeral replies for error messages',
          details: `Make error messages private with ephemeral:
\`\`\`typescript
try {
  // Command logic
} catch (error) {
  await interaction.reply({
    content: 'An error occurred!',
    ephemeral: true // Only visible to user
  });
}
\`\`\``,
          severity: 'low',
          docLink: getDocLink('InteractionReplyOptions', 'discord.js', 'interface'),
        })
      }
    }

    // Check for deferReply usage with long operations
    if ((code.includes('await') && code.includes('interaction.reply')) || code.includes('setTimeout')) {
      if (!code.includes('deferReply') && !code.includes('deferUpdate')) {
        suggestions.push({
          type: 'warning',
          message: 'Long operations should defer the interaction',
          details: `Use deferReply() for operations taking >3 seconds:
\`\`\`typescript
// Defer immediately
await interaction.deferReply();

// Do long operation (database, API call, etc.)
const result = await someAsyncOperation();

// Edit the deferred reply
await interaction.editReply({
  content: \`Result: \${result}\`
});
\`\`\`

Interactions expire after 3 seconds if not responded to.`,
          severity: 'medium',
          docLink: getDocLink('CommandInteraction') + '#deferReply',
        })
      }
    }

    // Check for using components without ActionRow
    if (code.includes('ButtonBuilder') || code.includes('SelectMenuBuilder')) {
      const idx = lines.findIndex(line => line.includes('ButtonBuilder') || line.includes('SelectMenuBuilder'))
      const windowLines = lines.slice(Math.max(0, idx - 2), Math.min(lines.length, idx + 10)).join('\n')
      const hasActionRowNearby = /ActionRowBuilder|addComponents|components\s*:\s*\[/.test(windowLines)
      if (!hasActionRowNearby) {
        const lineNum = idx + 1
        suggestions.push({
          type: 'error',
          message: 'Components must be wrapped in ActionRowBuilder',
          details: `Components need to be in an ActionRow:
\`\`\`typescript
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const row = new ActionRowBuilder()
  .addComponents(
    new ButtonBuilder()
      .setCustomId('button1')
      .setLabel('Click me!')
      .setStyle(ButtonStyle.Primary)
  );

await interaction.reply({
  content: 'Here are some buttons:',
  components: [row]
});
\`\`\``,
          severity: 'critical',
          line: lineNum,
          docLink: getDocLink('ActionRowBuilder', 'builders'),
        })
      }
    }

    // Check for REST API rate limit handling
    if (code.includes('.send(') || code.includes('.edit(') || code.includes('.delete(')) {
      if (!code.includes('catch') && !code.includes('try')) {
        suggestions.push({
          type: 'warning',
          message: 'Add error handling for rate limits and API errors',
          details: `Handle Discord API errors gracefully:
\`\`\`typescript
try {
  await channel.send('Hello!');
} catch (error) {
  if (error.code === 50013) {
    console.error('Missing permissions');
  } else if (error.code === 10008) {
    console.error('Unknown message');
  } else {
    console.error('Error:', error);
  }
}
\`\`\``,
          severity: 'medium',
          docLink: getDocLink('DiscordAPIError'),
        })
      }
    }

    // Check for client.user usage before ready event
    if (code.includes('client.user') && !code.includes("client.on('ready'")) {
      suggestions.push({
        type: 'warning',
        message: 'Access client.user only after ready event',
        details: `Wait for the ready event before using client.user:
\`\`\`typescript
client.once('ready', () => {
  console.log(\`Logged in as \${client.user.tag}\`);
  // Now safe to use client.user
});
\`\`\``,
        severity: 'medium',
        docLink: getDocLink('Client') + '#ready',
      })
    }

    // Check for string-based event names (old pattern)
    if (code.includes("Events.") && (code.includes("client.on('") || code.includes('client.on("'))) {
      suggestions.push({
        type: 'info',
        message: 'Consider using Events enum for event names',
        details: `Use the Events enum for type safety:
\`\`\`typescript
import { Events } from 'discord.js';

// ✅ Type-safe
client.on(Events.MessageCreate, message => { ... });
client.on(Events.InteractionCreate, interaction => { ... });

// vs ❌ String-based (prone to typos)
client.on('messageCreate', message => { ... });
\`\`\``,
        severity: 'low',
        docLink: getDocLink('Events', 'discord.js', 'enum'),
      })
    }

    return suggestions
  }
}
