import type { Suggestion } from '../types'
import { getDocLink } from '../discordMetadata'

/**
 * ErrorDetector - identifies common discord.js errors and best practices
 */
export class ErrorDetector {
  name = 'ErrorDetector'

  detect(code: string): Suggestion[] {
    const suggestions: Suggestion[] = []
    const lines = code.split('\n')

    // Check for missing error handlers
    if (code.includes('client.on') && !code.includes("client.on('error'") && !code.includes('client.on("error"')) {
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
        docLink: getDocLink('Client'),
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
        docLink: getDocLink('Collection'),
      })
    }

    // Check for hardcoded tokens
    if (code.includes('.login(') && !code.includes('process.env')) {
      const lineNum = lines.findIndex(line => line.includes('.login(')) + 1
      suggestions.push({
        type: 'error',
        message: 'Potential hardcoded bot token detected',
        details: `Never hardcode your bot token. Use environment variables:
\`\`\`typescript
// ❌ Bad - hardcoded token
client.login('YOUR_TOKEN_HERE');

// ✅ Good - environment variable
client.login(process.env.DISCORD_TOKEN);
\`\`\`

Create a \`.env\` file:
\`\`\`
DISCORD_TOKEN=your_token_here
\`\`\``,
        severity: 'critical',
        line: lineNum,
        docLink: getDocLink('Client') + '#login',
      })
    }

    // Check for interaction.reply() without checking if already replied
    if (code.includes('interaction.reply') && !code.includes('interaction.replied') && !code.includes('interaction.deferred')) {
      const lineNum = lines.findIndex(line => line.includes('interaction.reply')) + 1
      suggestions.push({
        type: 'warning',
        message: 'Missing interaction state check before replying',
        details: `Always check if interaction was already replied to:
\`\`\`typescript
if (!interaction.replied && !interaction.deferred) {
  await interaction.reply({ content: 'Response' });
} else {
  await interaction.editReply({ content: 'Response' });
}
\`\`\`

Or use deferReply for long operations:
\`\`\`typescript
await interaction.deferReply();
// Do long operation...
await interaction.editReply({ content: 'Done!' });
\`\`\``,
        severity: 'high',
        line: lineNum,
        docLink: getDocLink('CommandInteraction'),
      })
    }

    // Check for missing await on async operations
    if ((code.includes('interaction.reply') || code.includes('interaction.deferReply') || code.includes('.send(')) && !code.includes('await ') && !code.includes('.then(')) {
      suggestions.push({
        type: 'warning',
        message: 'Async Discord operations should be awaited',
        details: `Use \`await\` or \`.then()\` for async operations:
\`\`\`typescript
// ✅ Good
await interaction.reply({ content: 'Hello!' });
await message.channel.send('Hello!');

// ✅ Also good
interaction.reply({ content: 'Hello!' }).then(() => {
  console.log('Sent!');
});
\`\`\``,
        severity: 'medium',
        docLink: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function',
      })
    }

    // Check for deprecated message event usage
    if (code.includes("client.on('message'") || code.includes('client.on("message"')) {
      const lineNum = lines.findIndex(line => line.includes("client.on('message") || line.includes('client.on("message')) + 1
      suggestions.push({
        type: 'warning',
        message: 'Using deprecated "message" event',
        details: `The "message" event is deprecated. Use "messageCreate" instead:
\`\`\`typescript
// ❌ Deprecated
client.on('message', message => { ... });

// ✅ Current (v14+)
client.on('messageCreate', message => { ... });
\`\`\``,
        severity: 'high',
        line: lineNum,
        docLink: 'https://discord.js.org/docs/packages/discord.js/main/Client:class',
      })
    }

    // Check for SlashCommandBuilder missing required fields
    if (code.includes('SlashCommandBuilder')) {
      // Find the first line where SlashCommandBuilder appears and inspect nearby lines for .setName & .setDescription
      const startLine = lines.findIndex(line => line.includes('SlashCommandBuilder'))
      const windowLines = lines.slice(startLine, Math.min(startLine + 20, lines.length)).join('\n')
      const hasName = /.setName\s*\(/.test(windowLines)
      const hasDescription = /.setDescription\s*\(/.test(windowLines)
      if (!hasName || !hasDescription) {
        const lineNum = startLine + 1
        suggestions.push({
          type: 'error',
          message: 'SlashCommandBuilder missing required fields',
          details: `SlashCommandBuilder requires both name and description:
\`\`\`typescript
const command = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!');
\`\`\``,
          severity: 'critical',
          line: lineNum,
          docLink: getDocLink('SlashCommandBuilder', 'builders'),
        })
      }
    }

    // Check for EmbedBuilder with potential length issues
    if (code.includes('EmbedBuilder') && code.includes('.setDescription')) {
      suggestions.push({
        type: 'info',
        message: 'Remember embed description character limits',
        details: `Embed limits:
- Description: 4096 characters max
- Title: 256 characters max
- Fields: 25 max, each name/value: 256/1024 characters
- Total: 6000 characters across all fields

Truncate long content to avoid API errors.`,
        severity: 'low',
        docLink: getDocLink('EmbedBuilder', 'builders'),
      })
    }

    // Check for ButtonBuilder without required properties
    if (code.includes('ButtonBuilder')) {
      if (!code.includes('.setCustomId') && !code.includes('.setURL')) {
        const lineNum = lines.findIndex(line => line.includes('ButtonBuilder')) + 1
        suggestions.push({
          type: 'error',
          message: 'ButtonBuilder requires customId or URL',
          details: `Buttons need either customId (interactive) or URL (link button):
\`\`\`typescript
// Interactive button
const button = new ButtonBuilder()
  .setCustomId('my_button')
  .setLabel('Click me!')
  .setStyle(ButtonStyle.Primary);

// Link button
const link = new ButtonBuilder()
  .setURL('https://discord.js.org')
  .setLabel('Visit')
  .setStyle(ButtonStyle.Link);
\`\`\``,
          severity: 'critical',
          line: lineNum,
          docLink: getDocLink('ButtonBuilder', 'builders'),
        })
      }
    }

    // Check for common TypeError patterns
    if (code.includes("Cannot read property") || code.includes("Cannot read properties of undefined")) {
      suggestions.push({
        type: 'error',
        message: 'Potential undefined property access detected',
        details: `Use optional chaining to safely access properties:
\`\`\`typescript
// ❌ Might throw error
const value = obj.prop.nested;

// ✅ Safe access
const value = obj?.prop?.nested;

// ✅ With fallback
const value = obj?.prop?.nested ?? 'default';
\`\`\``,
        severity: 'high',
        docLink: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining',
      })
    }

    return suggestions
  }
}
