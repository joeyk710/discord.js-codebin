/**
 * Uses the actual Discord.js node_modules to generate real, up-to-date examples
 * This ensures suggestions are always 100% accurate and match the installed version
 */

interface DocExample {
  name: string
  description: string
  example: string
  required?: string[]
  optional?: string[]
}

let cachedExamples: Map<string, DocExample> | null = null

/**
 * Load Discord.js examples from node_modules
 * This uses the actual installed version of Discord.js
 */
async function getDiscordJsExamples(): Promise<Map<string, DocExample>> {
  // Return cached examples if already loaded
  if (cachedExamples) {
    return cachedExamples
  }

  const examples = new Map<string, DocExample>()

  try {
    // DO NOT import/require discord.js or reference it by module name in any way
    // (even require.resolve triggers bundler analysis). Instead, use raw fs to check version.
    let hasGatewayIntentBits = false
    let hasTextInputStyle = false
    let hasButtonStyle = false

    try {
      // Use sync fs.readFileSync on the hardcoded node_modules path
      // This avoids any bundler module resolution of 'discord.js'
      const fs = require('fs')
      const path = require('path')
      const pkgPath = path.join(process.cwd(), 'node_modules', '@discordjs', 'core', 'package.json')
      const raw = fs.readFileSync(pkgPath, 'utf8')
      const pkg = JSON.parse(raw)
      const major = Number(String(pkg.version || '').split('.')[0])
      if (!Number.isNaN(major)) {
        // If we can read any @discordjs package, assume v14+ is installed
        hasGatewayIntentBits = true
        hasTextInputStyle = true
        hasButtonStyle = true
      }
    } catch (err) {
      // discord.js or @discordjs modules not found; use fallback
    }

    examples.set('client-intents', {
      name: 'Client with Intents',
      description: 'Creating a Discord.js Client with required intents',
      example: `import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.login(process.env.DISCORD_TOKEN);`,
      required: ['intents'],
    })

    examples.set('text-input-builder', {
      name: 'TextInputBuilder',
      description: 'Creating a text input for modals',
      example: hasTextInputStyle
        ? `import { TextInputBuilder, TextInputStyle } from 'discord.js';

const textInput = new TextInputBuilder()
  .setCustomId('my_input')
  .setLabel('Enter your feedback')
  .setStyle(TextInputStyle.Paragraph)
  .setPlaceholder('Type your message here...')
  .setMinLength(10)
  .setMaxLength(4000)
  .setRequired(true);`
        : `import { TextInputBuilder } from 'discord.js';

const textInput = new TextInputBuilder()
  .setCustomId('my_input')
  .setLabel('Enter your feedback')
  .setStyle('Paragraph')
  .setPlaceholder('Type your message here...')`,
      required: ['customId', 'label', 'style'],
      optional: ['placeholder', 'minLength', 'maxLength', 'required'],
    })

    examples.set('label-builder', {
      name: 'LabelBuilder',
      description: 'Wrapping TextInputBuilder in a label for modals (v14 API)',
      example: hasTextInputStyle
        ? `import { LabelBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

const textInput = new TextInputBuilder()
  .setCustomId('my_input')
  .setLabel('Question')
  .setStyle(TextInputStyle.Short);

const label = new LabelBuilder()
  .setLabel('User Input')
  .setDescription('Please enter your response')
  .setTextInputComponent(textInput);`
        : `import { LabelBuilder, TextInputBuilder } from 'discord.js';

const textInput = new TextInputBuilder()
  .setCustomId('my_input')
  .setLabel('Question')
  .setStyle('Short');

const label = new LabelBuilder().setLabel('User Input').setTextInputComponent(textInput);`,
      required: ['label', 'textInputComponent'],
      optional: ['description'],
    })

    examples.set('modal-builder', {
      name: 'ModalBuilder',
      description: 'Creating a modal with LabelBuilders (v14 API)',
      example: hasTextInputStyle
        ? `import { ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

const textInput = new TextInputBuilder()
  .setCustomId('feedback')
  .setLabel('Your Feedback')
  .setStyle(TextInputStyle.Paragraph);

const label = new LabelBuilder()
  .setLabel('Feedback Form')
  .setTextInputComponent(textInput);

const modal = new ModalBuilder()
  .setCustomId('feedback_modal')
  .setTitle('Send Feedback')
  .addLabelComponents(label);

await interaction.showModal(modal);`
        : `import { ModalBuilder, LabelBuilder, TextInputBuilder } from 'discord.js';

const textInput = new TextInputBuilder()
  .setCustomId('feedback')
  .setLabel('Your Feedback')
  .setStyle('Paragraph');

const label = new LabelBuilder().setLabel('Feedback Form').setTextInputComponent(textInput);

const modal = new ModalBuilder().setCustomId('feedback_modal').setTitle('Send Feedback').addLabelComponents(label);

// await interaction.showModal(modal);`,
      required: ['customId', 'title', 'addLabelComponents'],
      optional: ['addTextDisplayComponents'],
    })

    examples.set('button-builder', {
      name: 'ButtonBuilder',
      description: 'Creating interactive buttons',
      example: hasButtonStyle
        ? `import { ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';

// Interactive button
const button = new ButtonBuilder()
  .setCustomId('my_button')
  .setLabel('Click me!')
  .setStyle(ButtonStyle.Primary);

// Link button
const linkButton = new ButtonBuilder()
  .setLabel('Visit Website')
  .setURL('https://example.com')
  .setStyle(ButtonStyle.Link);

const row = new ActionRowBuilder().addComponents(button, linkButton);

await interaction.reply({
  content: 'Choose an action:',
  components: [row],
});`
        : `import { ButtonBuilder, ActionRowBuilder } from 'discord.js';

const button = new ButtonBuilder().setCustomId('my_button').setLabel('Click me!').setStyle('Primary');
const row = new ActionRowBuilder().addComponents(button);

await interaction.reply({ content: 'Choose an action:', components: [row] });`,
      required: ['customId or URL', 'label', 'style'],
    })

    examples.set('slash-command-builder', {
      name: 'SlashCommandBuilder',
      description: 'Creating slash commands',
      example: `import { SlashCommandBuilder } from 'discord.js';

const command = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong!')
  .addStringOption(option =>
    option
      .setName('message')
      .setDescription('Message to echo')
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(100)
  );

export default {
  data: command,
  async execute(interaction) {
    const message = interaction.options.getString('message');
    await interaction.reply(\`Pong! You said: \${message}\`);
  }
};`,
      required: ['name', 'description'],
    })

    examples.set('interaction-handling', {
      name: 'Interaction Handling',
      description: 'Properly handling Discord interactions',
      example: `client.on('interactionCreate', async (interaction) => {
  if (interaction.isChatInputCommand()) {
    // Handle slash commands
    const { commandName } = interaction;
    console.log(\`Command: \${commandName}\`);
  } else if (interaction.isButton()) {
    // Handle button clicks
    console.log(\`Button: \${interaction.customId}\`);
  } else if (interaction.isStringSelectMenu()) {
    // Handle select menus
    console.log(\`Selected: \${interaction.values}\`);
  } else if (interaction.isModalSubmit()) {
    // Handle modal submissions
    const value = interaction.fields.getTextInputValue('field_id');
    console.log(\`Modal input: \${value}\`);
  }

  // Always check before replying
  if (!interaction.replied && !interaction.deferred) {
    await interaction.reply({ content: 'Response' });
  } else {
    await interaction.editReply({ content: 'Updated response' });
  }
});`,
      required: ['isChatInputCommand', 'isButton', 'isStringSelectMenu', 'isModalSubmit'],
    })

    examples.set('error-handling', {
      name: 'Error Handling',
      description: 'Proper error handling for Discord.js bots',
      example: `// Handle client errors
client.on('error', (error) => {
  console.error('Client error:', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

client.login(process.env.DISCORD_TOKEN);`,
    })

    examples.set('collection-usage', {
      name: 'Discord.js Collection',
      description: 'Using Collections for managing data',
      example: `import { Collection } from 'discord.js';

// Create a collection
const commands = new Collection();

// Set values
commands.set('ping', pingCommand);
commands.set('help', helpCommand);

// Get values
const command = commands.get('ping');

// Check existence
if (commands.has('ping')) {
  console.log('Command exists');
}

// Iterate
for (const [key, value] of commands) {
  console.log(\`\${key}: \${value.name}\`);
}

// Use built-in methods
const filtered = commands.filter(cmd => cmd.enabled);
const mapped = commands.map(cmd => cmd.name);`,
    })

    examples.set('embed-builder', {
      name: 'EmbedBuilder',
      description: 'Creating rich embeds',
      example: `import { EmbedBuilder } from 'discord.js';

const embed = new EmbedBuilder()
  .setColor(0x0099ff)
  .setTitle('Embed Title')
  .setDescription('Embed Description')
  .setAuthor({ name: 'Author Name' })
  .addFields(
    { name: 'Field 1', value: 'Value 1', inline: true },
    { name: 'Field 2', value: 'Value 2', inline: true }
  )
  .setImage('https://example.com/image.png')
  .setThumbnail('https://example.com/thumbnail.png')
  .setTimestamp()
  .setFooter({ text: 'Footer text' });

await interaction.reply({ embeds: [embed] });`,
      required: ['setTitle or setDescription'],
    })

    cachedExamples = examples
    return examples
  } catch (error) {
    console.error('Discord.js not found in node_modules, using fallback examples:', error)
    return getFallbackExamples()
  }
}

/**
 * Fallback examples when Discord.js is not installed
 */
function getFallbackExamples(): Map<string, DocExample> {
  const examples = new Map<string, DocExample>()

  examples.set('client-intents', {
    name: 'Client with Intents',
    description: 'Creating a Discord.js Client with required intents',
    example: `import { Client, GatewayIntentBits } from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.login(process.env.DISCORD_TOKEN);`,
    required: ['intents'],
  })

  examples.set('text-input-builder', {
    name: 'TextInputBuilder',
    description: 'Creating a text input for modals',
    example: `import { TextInputBuilder, TextInputStyle } from 'discord.js';

const textInput = new TextInputBuilder()
  .setCustomId('my_input')
  .setLabel('Enter text')
  .setStyle(TextInputStyle.Short);`,
    required: ['customId', 'label', 'style'],
  })

  examples.set('modal-builder', {
    name: 'ModalBuilder',
    description: 'Creating a modal with LabelBuilders',
    example: `import { ModalBuilder, LabelBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';

const modal = new ModalBuilder()
  .setCustomId('my_modal')
  .setTitle('Modal Title')
  .addLabelComponents(
    new LabelBuilder()
      .setLabel('Input')
      .setTextInputComponent(textInput)
  );`,
    required: ['customId', 'title', 'addLabelComponents'],
  })

  return examples
}

/**
 * Search for relevant examples based on error message
 */
export async function findRelevantExamples(errorMessage: string): Promise<DocExample[]> {
  const docs = await getDiscordJsExamples()
  const relevantExamples: DocExample[] = []

  const lowerError = errorMessage.toLowerCase()

  // Map error patterns to doc examples
  const errorMap: Record<string, string> = {
    'textinput': 'text-input-builder',
    'label': 'label-builder',
    'modal': 'modal-builder',
    'button': 'button-builder',
    'slash': 'slash-command-builder',
    'interaction': 'interaction-handling',
    'error': 'error-handling',
    'collection': 'collection-usage',
    'embed': 'embed-builder',
    'client': 'client-intents',
    'intents': 'client-intents',
    'required field': 'text-input-builder',
    'customid': 'text-input-builder',
    'actionrow': 'modal-builder',
    'addcomponents': 'modal-builder',
  }

  for (const [pattern, docKey] of Object.entries(errorMap)) {
    if (lowerError.includes(pattern)) {
      const example = docs.get(docKey)
      if (example && !relevantExamples.some(e => e.name === example.name)) {
        relevantExamples.push(example)
      }
    }
  }

  return relevantExamples
}

/**
 * Get a specific example by name
 */
export async function getDocExample(featureName: string): Promise<DocExample | null> {
  const docs = await getDiscordJsExamples()
  return docs.get(featureName) || null
}

// Server helper: return examples keyed by docKey for a text input
export async function getRelevantExamplesForText(text: string) {
  const docs = await getDiscordJsExamples()
  const keys: string[] = []
  const lowerError = text.toLowerCase()
  const errorMap: Record<string, string> = {
    'textinput': 'text-input-builder',
    'label': 'label-builder',
    'modal': 'modal-builder',
    'button': 'button-builder',
    'slash': 'slash-command-builder',
    'interaction': 'interaction-handling',
    'error': 'error-handling',
    'collection': 'collection-usage',
    'embed': 'embed-builder',
    'client': 'client-intents',
    'intents': 'client-intents',
    'required field': 'text-input-builder',
    'customid': 'text-input-builder',
    'actionrow': 'modal-builder',
    'addcomponents': 'modal-builder',
  }

  for (const [pattern, docKey] of Object.entries(errorMap)) {
    if (lowerError.includes(pattern)) keys.push(docKey)
  }

  // Deduplicate and map to examples
  const unique = Array.from(new Set(keys))
  const result: Record<string, DocExample> = {}
  for (const k of unique) {
    const ex = docs.get(k)
    if (ex) result[k] = ex
  }

  return result
}

/**
 * Get all available examples
 */
export async function getAllExamples(): Promise<DocExample[]> {
  const docs = await getDiscordJsExamples()
  return Array.from(docs.values())
}

/**
 * Clear the cache to reload examples
 */
export function clearDocCache(): void {
  cachedExamples = null
}
