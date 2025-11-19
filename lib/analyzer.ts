import { RESTJSONErrorCodes } from 'discord-api-types/v10'

export interface Suggestion {
  type: 'error' | 'warning' | 'info' | 'suggestion'
  message: string
  details?: string
  line?: number
  code?: string
  docLink?: string
}

export interface AnalysisResult {
  suggestions: Suggestion[]
}

/**
 * Maps Discord API error codes to helpful messages and solutions
 * Uses discord-api-types/v10 RESTJSONErrorCodes enum
 */
const ERROR_SOLUTIONS: Record<number, { message: string; solution: string }> = {
  // Unknown errors (10000-10099)
  [RESTJSONErrorCodes.UnknownAccount]: {
    message: 'Unknown account',
    solution: 'This error typically occurs with invalid authentication. Verify your bot token is correct and not revoked.',
  },
  [RESTJSONErrorCodes.UnknownApplication]: {
    message: 'Unknown application',
    solution: 'The application ID is invalid. Verify the application ID from Discord Developer Portal.',
  },
  [RESTJSONErrorCodes.UnknownChannel]: {
    message: 'Unknown channel',
    solution: 'The channel was deleted or the ID is incorrect. Verify the channel ID and ensure the channel exists.',
  },
  [RESTJSONErrorCodes.UnknownGuild]: {
    message: 'Unknown guild',
    solution: 'The guild was deleted or the ID is incorrect. Verify the guild ID and ensure the bot is in that guild.',
  },
  [RESTJSONErrorCodes.UnknownIntegration]: {
    message: 'Unknown integration',
    solution: 'The integration was removed or does not exist. Check if the integration is still connected.',
  },
  [RESTJSONErrorCodes.UnknownInvite]: {
    message: 'Unknown invite',
    solution: 'The invite code is invalid or expired. Verify the invite code and try again.',
  },
  [RESTJSONErrorCodes.UnknownMember]: {
    message: 'Unknown member',
    solution: 'The user is not a member of the guild. Verify the user ID and ensure they have joined the guild.',
  },
  [RESTJSONErrorCodes.UnknownMessage]: {
    message: 'Unknown message',
    solution: 'The message was deleted or the ID is incorrect. Verify the message ID is valid.',
  },
  [RESTJSONErrorCodes.UnknownPermissionOverwrite]: {
    message: 'Unknown permission overwrite',
    solution: 'The permission overwrite does not exist. Verify the overwrite ID and ensure it is still valid.',
  },
  [RESTJSONErrorCodes.UnknownRole]: {
    message: 'Unknown role',
    solution: 'The role was deleted or does not exist. Verify the role ID and ensure the role still exists in the guild.',
  },
  [RESTJSONErrorCodes.UnknownToken]: {
    message: 'Unknown token',
    solution: 'The token is invalid or has been revoked. Regenerate your bot token in the Developer Portal.',
  },
  [RESTJSONErrorCodes.UnknownUser]: {
    message: 'Unknown user',
    solution: 'The user does not exist or the ID is incorrect. Verify the user ID is valid.',
  },
  [RESTJSONErrorCodes.UnknownEmoji]: {
    message: 'Unknown emoji',
    solution: 'The emoji was deleted or does not exist. Verify the emoji ID and ensure it is still valid.',
  },
  [RESTJSONErrorCodes.UnknownWebhook]: {
    message: 'Unknown webhook',
    solution: 'The webhook was deleted or does not exist. Verify the webhook ID is correct.',
  },
  [RESTJSONErrorCodes.UnknownInteraction]: {
    message: 'Unknown interaction - The interaction token may have expired (>3 seconds) or was already used',
    solution: 'Call interaction.deferReply() immediately for long operations, then use interaction.editReply(). Check interaction.replied before replying.',
  },

  // Permission errors (50000-50099)
  [RESTJSONErrorCodes.MissingAccess]: {
    message: 'Missing access to guild/channel',
    solution: 'The bot lacks permissions to access this resource. Verify the bot has the required role/permissions.',
  },
  [RESTJSONErrorCodes.InvalidAccountType]: {
    message: 'Invalid account type',
    solution: 'The account type is invalid for this operation. Use the correct account type.',
  },
  [RESTJSONErrorCodes.CannotExecuteActionOnDMChannel]: {
    message: 'Cannot execute action on a DM channel',
    solution: 'This action cannot be performed in DMs. Use a guild channel instead.',
  },
  [RESTJSONErrorCodes.GuildWidgetDisabled]: {
    message: 'Guild widget disabled',
    solution: 'The widget is not enabled for this guild. Enable it in server settings.',
  },
  [RESTJSONErrorCodes.CannotEditMessageAuthoredByAnotherUser]: {
    message: 'Cannot edit a message authored by another user',
    solution: 'You can only edit your own messages. Ensure the message was sent by the bot.',
  },
  [RESTJSONErrorCodes.CannotSendAnEmptyMessage]: {
    message: 'Cannot send an empty message',
    solution: 'Message must have content, embeds, files, or other content. Add content before sending.',
  },
  [RESTJSONErrorCodes.CannotSendMessagesToThisUser]: {
    message: 'Cannot send messages to this user',
    solution: 'The user has DMs disabled. Inform them to enable DMs from server members.',
  },
  [RESTJSONErrorCodes.CannotSendMessagesInNonTextChannel]: {
    message: 'Cannot send messages in a voice channel',
    solution: 'Voice channels cannot receive text messages. Use a text channel instead.',
  },
  [RESTJSONErrorCodes.InvalidOAuth2AccessToken]: {
    message: 'Invalid OAuth2 access token',
    solution: 'The OAuth2 token is invalid. Use a valid token.',
  },
  [RESTJSONErrorCodes.InvalidWebhookToken]: {
    message: 'Invalid webhook token',
    solution: 'The webhook token is invalid or expired. Regenerate the webhook.',
  },
  [RESTJSONErrorCodes.MissingPermissions]: {
    message: 'Missing required permissions',
    solution: 'Grant the bot necessary permissions (SEND_MESSAGES, MANAGE_ROLES, etc.) and ensure role hierarchy is correct.',
  },

  // Rate limit/Request errors (30000-30099)
  [RESTJSONErrorCodes.MaximumNumberOfFriendsReached]: {
    message: 'Maximum number reached',
    solution: 'You have reached a limit. Remove some items and try again.',
  },
  [RESTJSONErrorCodes.MaximumNumberOfWebhooksReached]: {
    message: 'Maximum number of webhooks reached',
    solution: 'The channel has reached the maximum webhook limit. Delete unused webhooks before creating new ones.',
  },

  // Auth errors (40000-40099)
  [RESTJSONErrorCodes.InvalidToken]: {
    message: 'Invalid authentication token',
    solution: 'The bot token is invalid or missing. Verify the token and ensure it starts with "Bot ".',
  },
}

export function analyzeDiscordJsCode(code: string): Suggestion[] {
  const suggestions: Suggestion[] = []
  const lines = code.split('\n')

  // Check for old intents usage
  if (code.includes('intents: [') && !code.includes('GatewayIntentBits')) {
    const lineNum = lines.findIndex(line => line.includes('intents:')) + 1
    suggestions.push({
      type: 'warning',
      message: 'Using string intents - Consider using GatewayIntentBits',
      line: lineNum,
      code: 'intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],',
      details: `Line ${lineNum}: Replace string intents with GatewayIntentBits enum for better type safety`,
    })
  }

  // Check for missing intents
  if (code.includes('new Client') && !code.includes('intents:')) {
    const lineNum = lines.findIndex(line => line.includes('new Client')) + 1
    suggestions.push({
      type: 'error',
      message: 'Client created without intents',
      line: lineNum,
      code: 'new Client({\n  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],\n})',
      details: `Line ${lineNum}: Add intents when creating a Client instance (required in discord.js v13+)`,
    })
  }

  // Check for MessageContent intent if handling message content
  if (code.includes('message.content') && !code.includes('MessageContent')) {
    const lineNum = lines.findIndex(line => line.includes('message.content')) + 1
    suggestions.push({
      type: 'warning',
      message: 'Accessing message.content without MessageContent intent',
      line: lineNum,
      code: 'intents: [GatewayIntentBits.MessageContent, ...]',
      details: `Line ${lineNum}: Add GatewayIntentBits.MessageContent to your intents to read message content`,
    })
  }

  // Check for error handling
  if (code.includes('client.on(') && !code.includes('error') && !code.includes('catch')) {
    suggestions.push({
      type: 'suggestion',
      message: 'Consider adding error handling',
      code: 'client.on("error", error => {\n  console.error("Client error:", error);\n});\n\nprocess.on("unhandledRejection", reason => {\n  console.error("Unhandled Rejection:", reason);\n});',
      details: 'Add error listeners to prevent crashes and handle unexpected issues gracefully',
    })
  }

  // Check for token in code
  if (code.includes('.login(') && !code.includes('process.env') && !code.includes('TOKEN') && code.includes("'") && code.includes('"')) {
    const lineNum = lines.findIndex(line => line.includes('.login(')) + 1
    suggestions.push({
      type: 'error',
      message: 'Avoid hardcoding your bot token',
      line: lineNum,
      code: 'client.login(process.env.DISCORD_TOKEN);',
      details: `Line ${lineNum}: Use environment variables like process.env.DISCORD_TOKEN instead of hardcoding tokens`,
    })
  }

  // Check for deprecations
  if (code.includes('client.commands') && !code.includes('Collection')) {
    suggestions.push({
      type: 'info',
      message: 'Consider using discord.js Collection for command handling',
      code: 'const { Collection } = require("discord.js");\nclient.commands = new Collection();',
      details: 'Collections provide better performance and built-in methods for managing commands',
    })
  }

  // Check for TextInputBuilder without required fields
  if (code.includes('TextInputBuilder') || code.includes('textInput')) {
    if (!code.includes('.setCustomId') || !code.includes('.setLabel')) {
      const lineNum = lines.findIndex(line => line.includes('TextInputBuilder') || line.includes('textInput')) + 1
      suggestions.push({
        type: 'error',
        message: 'TextInputBuilder missing required fields (customId, label)',
        line: lineNum,
        code: 'new TextInputBuilder()\n  .setCustomId("my_input")\n  .setLabel("Label")\n  .setStyle(TextInputStyle.Short)',
        details: `Line ${lineNum}: TextInputBuilder requires customId, label, and style. Ensure all required fields are set before calling toJSON()`,
      })
    }
  }

  // Check for ModalBuilder without actions
  if (code.includes('ModalBuilder') || code.includes('Modal')) {
    if (!code.includes('.setCustomId') || !code.includes('.setTitle')) {
      const lineNum = lines.findIndex(line => line.includes('ModalBuilder') || line.includes('Modal')) + 1
      suggestions.push({
        type: 'error',
        message: 'Modal missing required fields (customId, title, components)',
        line: lineNum,
        code: 'new ModalBuilder()\n  .setCustomId("my_modal")\n  .setTitle("Modal Title")\n  .addLabelComponents(new LabelBuilder().setLabel("Question").setTextInputComponent(textInput))',
        details: `Line ${lineNum}: Modals require customId, title, and at least one LabelComponent with a TextInputBuilder inside`,
      })
    }

    // Check for old ActionRowBuilder usage with ModalBuilder
    if (code.includes('ModalBuilder') && code.includes('ActionRowBuilder') && code.includes('addComponents(')) {
      const lineNum = lines.findIndex(line => line.includes('addComponents')) + 1
      suggestions.push({
        type: 'error',
        message: 'ModalBuilder uses addLabelComponents(), not ActionRowBuilder',
        line: lineNum,
        code: 'const label = new LabelBuilder()\n  .setLabel("Question")\n  .setTextInputComponent(textInput);\n\nmodal.addLabelComponents(label);',
        details: `Line ${lineNum}: discord.js v14 modals use LabelBuilder and addLabelComponents(), not ActionRowBuilder. Update to use LabelBuilder wrapping TextInputBuilder`,
      })
    }
  }

  // Check for ButtonBuilder without customId
  if (code.includes('ButtonBuilder') || code.includes('button')) {
    if (!code.includes('.setCustomId') && !code.includes('.setURL')) {
      const lineNum = lines.findIndex(line => line.includes('ButtonBuilder') || line.includes('button')) + 1
      suggestions.push({
        type: 'error',
        message: 'ButtonBuilder requires customId or URL',
        line: lineNum,
        code: 'new ButtonBuilder()\n  .setCustomId("my_button")\n  .setLabel("Click me")\n  .setStyle(ButtonStyle.Primary)',
        details: `Line ${lineNum}: Buttons need either a customId (for interactive buttons) or URL (for link buttons)`,
      })
    }
  }

  // Check for SlashCommandBuilder without required properties
  if (code.includes('SlashCommandBuilder')) {
    if (!code.includes('.setName') || !code.includes('.setDescription')) {
      const lineNum = lines.findIndex(line => line.includes('SlashCommandBuilder')) + 1
      suggestions.push({
        type: 'error',
        message: 'SlashCommandBuilder missing required fields (name, description)',
        line: lineNum,
        code: 'new SlashCommandBuilder()\n  .setName("mycommand")\n  .setDescription("Command description")\n  .addStringOption(option => option.setName("arg").setDescription("Argument").setRequired(true))',
        details: `Line ${lineNum}: SlashCommandBuilder requires name and description. Description must be 1-100 characters`,
      })
    }
  }

  // Check for missing toJSON() calls on builders
  if ((code.includes('ButtonBuilder') || code.includes('ModalBuilder') || code.includes('TextInputBuilder') || code.includes('SlashCommandBuilder')) && !code.includes('.toJSON()')) {
    if (code.includes('.addComponents(') || code.includes('interaction.showModal(') || code.includes('interaction.reply(')) {
      suggestions.push({
        type: 'warning',
        message: 'Builder needs .toJSON() before sending',
        code: 'interaction.reply({\n  components: [actionRow.toJSON()],\n});',
        details: 'Builders must be converted to JSON before sending to Discord API via .toJSON() or they will cause validation errors',
      })
    }
  }

  // Check for undefined interaction responses
  if (code.includes('interaction.') && !code.includes('interaction.replied') && !code.includes('defer')) {
    if (code.includes('interaction.reply(') && code.includes('interaction.editReply(')) {
      suggestions.push({
        type: 'warning',
        message: 'Check interaction.replied before replying or deferring',
        code: 'if (!interaction.replied) {\n  await interaction.reply({ content: "..." });\n} else {\n  await interaction.editReply({ content: "..." });\n}',
        details: 'Always check if an interaction has been replied to before attempting to reply or defer',
      })
    }
  }

  // Detect Discord API errors in error messages or logs
  // Using discord-api-types RESTJSONErrorCodes enum mapped to ERROR_SOLUTIONS above

  // Detect discord.js specific errors (from DiscordJSErrorCodes - ALL ERROR TYPES)
  const djsErrorPatterns: Record<string, { message: string; solution: string; docLink?: string }> = {
    // General errors
    'ClientInvalidToken': {
      message: 'Invalid token provided to client',
      solution: 'Ensure your bot token is correct and starts with "Bot ". Regenerate if needed in the Discord Developer Portal.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/Client:class',
    },
    'ClientInvalidIntents': {
      message: 'Invalid intents provided to client',
      solution: 'Use valid GatewayIntentBits values. Check if all intents are properly imported from discord.js.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/GatewayIntentBits:enum',
    },
    'ClientMissingIntents': {
      message: 'Missing required intents for this operation',
      solution: 'Add the required GatewayIntentBits to your client intents. Check the error message for which intent is needed.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/GatewayIntentBits:enum',
    },
    'ClientInvalidOption': {
      message: 'Invalid option provided to client',
      solution: 'Check your Client constructor options are valid. Review the Client API documentation.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/Client:class',
    },
    'ClientNotReady': {
      message: 'Client is not ready yet',
      solution: 'Wait for the "ready" event before using client methods. Check if the bot has logged in successfully.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/Client:class#ready',
    },

    // Interaction errors
    'InteractionAlreadyReplied': {
      message: 'The reply to this interaction has already been sent or deferred',
      solution: 'Check if interaction.replied or interaction.deferred is true before calling interaction.reply(). Use interaction.editReply() instead if already replied.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/Interaction:class#replied',
    },
    'InteractionNotReplied': {
      message: 'The interaction has not been replied to',
      solution: 'Call interaction.reply() or interaction.deferReply() first before using editReply() or deleteReply().',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/Interaction:class#reply',
    },
    'InteractionEphemeralReplied': {
      message: 'Cannot modify an ephemeral interaction response',
      solution: 'Ephemeral messages cannot be edited or deleted after sending. Use a non-ephemeral reply if you need to modify it later.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/Interaction:class#reply',
    },

    // Command errors
    'CommandInteractionOptionNotFound': {
      message: 'The option for this interaction command was not found',
      solution: 'Verify the option name is correct and matches what was defined in the SlashCommandBuilder. Check spelling.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/CommandInteraction:class#options',
    },
    'CommandInteractionOptionNotType': {
      message: 'The option provided was not the correct type',
      solution: 'Verify the option type matches what was expected (user, string, integer, boolean, etc.).',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/CommandInteraction:class#options',
    },

    // Builder/Structure errors
    'ValidationError': {
      message: 'Builder validation error - missing required fields or invalid values',
      solution: 'Ensure all required builder fields are set before calling .toJSON(). For ButtonBuilder: customId and label required. For EmbedBuilder: description required. For SelectMenuBuilder: customId and at least 1 option required.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/Builders:namespace',
    },
    'SectionAccessoryError': {
      message: 'Your section has no accessory - Builder missing required component',
      solution: 'Ensure all required builder fields are set. ButtonBuilder needs customId + label. ThumbnailBuilder needs a URL. SelectMenuBuilder needs customId + options.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/Builders:namespace',
    },

    // Type errors
    'DiscordJSError': {
      message: 'A general discord.js error occurred',
      solution: 'Check the full error message for more details.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/DiscordAPIError:class',
    },
    'DiscordAPIError': {
      message: 'A Discord API error occurred',
      solution: 'Check the error code in the message. Look up the specific error code for the solution.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/DiscordAPIError:class',
    },
    'DiscordRangeError': {
      message: 'Value out of acceptable range',
      solution: 'Check parameter constraints: message length <2000, embed descriptions <4096, embed total <6000, choices 1-25, color 0-16777215.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/DiscordRangeError:class',
    },
    'DiscordTypeError': {
      message: 'Type error in Discord.js code',
      solution: 'Verify all types are correct. Check if objects are properly initialized before use.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/DiscordTypeError:class',
    },

    // Generic errors
    'InvalidType': {
      message: 'Invalid type provided',
      solution: 'Check that the type matches expected values.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/DiscordTypeError:class',
    },
    'InvalidToken': {
      message: 'Invalid token provided',
      solution: 'Regenerate your bot token in the Discord Developer Portal and ensure it\'s correct.',
      docLink: 'https://discord.com/developers/applications',
    },
    'RangeError': {
      message: 'Value out of acceptable range',
      solution: 'Check parameter constraints and value bounds.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/DiscordRangeError:class',
    },
    'TypeError': {
      message: 'Type error in Discord.js code',
      solution: 'Verify all types are correct.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/DiscordTypeError:class',
    },

    // Guild/Channel/Member errors
    'GuildMembersTimeout': {
      message: 'Members didn\'t arrive in time - Guild member fetch timeout',
      solution: 'Add GatewayIntentBits.GuildMembers intent if missing, or increase timeout: guild.members.fetch({ time: 60000 }).',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/GuildMemberManager:class#fetch',
    },
    'GuildChannelResolveError': {
      message: 'Guild channel could not be resolved',
      solution: 'Verify the channel ID is correct and the channel still exists in the guild.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/Guild:class#channels',
    },
    'GuildMemberResolveError': {
      message: 'Guild member could not be resolved',
      solution: 'Verify the user ID is correct and the user is a member of the guild.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/GuildMemberManager:class',
    },
    'GuildRoleResolveError': {
      message: 'Guild role could not be resolved',
      solution: 'Verify the role ID is correct and the role still exists in the guild.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/Guild:class#roles',
    },
    'GuildEmojiResolveError': {
      message: 'Guild emoji could not be resolved',
      solution: 'Verify the emoji ID is correct and the emoji still exists in the guild.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/Guild:class#emojis',
    },
    'GuildStickerResolveError': {
      message: 'Guild sticker could not be resolved',
      solution: 'Verify the sticker ID is correct and the sticker still exists in the guild.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/Guild:class#stickers',
    },

    // Collection errors
    'CollectionError': {
      message: 'Error with discord.js Collection',
      solution: 'Verify you\'re using Collection methods correctly. Check that the key/value types match.',
      docLink: 'https://discord.js.org/docs/packages/collection/stable',
    },

    // Permission errors
    'PermissionError': {
      message: 'Missing required permissions',
      solution: 'Ensure the bot has the required permissions in the guild or channel. Check role hierarchy.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/PermissionFlagsBits:enum',
    },
    'PermissionsFlagsBitsInvalid': {
      message: 'Invalid permissions flags provided',
      solution: 'Use valid PermissionFlagsBits values. Check the permissions enum.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/PermissionFlagsBits:enum',
    },

    // Message/Embed errors
    'MessageBulkDeleteRateLimited': {
      message: 'Bulk delete was rate limited',
      solution: 'Add a delay between bulk delete operations or reduce the number of messages deleted at once.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/TextChannel:class#bulkDelete',
    },
    'MessageEmbedDescription': {
      message: 'Embed description too long',
      solution: 'Keep embed descriptions under 4096 characters.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/EmbedBuilder:class',
    },

    // Voice errors
    'VoiceChannelJoinFailed': {
      message: 'Failed to join voice channel',
      solution: 'Ensure the bot has permission to connect and speak. Check if the channel is a voice channel.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/VoiceChannel:class',
    },
    'VoiceConnectionNotConnected': {
      message: 'Voice connection is not connected',
      solution: 'Call joinVoiceChannel() first before attempting to use the voice connection.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/VoiceConnection:class',
    },

    // API/HTTP errors
    'RESTInvalidVersion': {
      message: 'Invalid REST API version',
      solution: 'Use a valid Discord API version (e.g., 10, 11).',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/REST:class',
    },
    'RESTInvalidMethod': {
      message: 'Invalid HTTP method',
      solution: 'Use valid HTTP methods (GET, POST, PUT, PATCH, DELETE).',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/REST:class',
    },

    // Application errors
    'ApplicationCommandOptionMissing': {
      message: 'Application command option is missing',
      solution: 'Define all required options in your slash command builder.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/SlashCommandBuilder:class',
    },
    'ApplicationCommandSubcommandInvalid': {
      message: 'Invalid subcommand structure',
      solution: 'Ensure subcommands are properly nested and only used at correct levels.',
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/SlashCommandBuilder:class',
    },

    // Common TypeError patterns
    'CannotReadUndefined': {
      message: 'Cannot read properties of undefined',
      solution: `**How to fix:**\n\n1. Use optional chaining (?.) to safely access properties:\n\`\`\`\nconst desc = interaction.options?.getString("option")?.description\n\`\`\`\n\n2. Add null checks before accessing:\n\`\`\`\nif (interaction.options) {\n  const option = interaction.options.getString("option")\n  if (option) {\n    const desc = option.description\n  }\n}\n\`\`\`\n\n3. Use nullish coalescing for default values:\n\`\`\`\nconst desc = interaction.options?.getString("option")?.description ?? "default"\n\`\`\``,
      docLink: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining',
    },
    'CannotReadNull': {
      message: 'Cannot read properties of null',
      solution: `**How to fix:**\n\n1. Add null checks:\n\`\`\`\nif (value !== null) {\n  const prop = value.property\n}\n\`\`\`\n\n2. Use optional chaining:\n\`\`\`\nconst prop = value?.property\n\`\`\`\n\n3. Ensure objects are properly initialized before use.`,
      docLink: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null',
    },
    'CannotSetPropertyOfUndefined': {
      message: 'Cannot set properties of undefined',
      solution: `**How to fix:**\n\n1. Initialize the object first:\n\`\`\`\nlet obj = {} // Initialize\nobj.property = value\n\`\`\`\n\n2. Check if object exists:\n\`\`\`\nif (obj) {\n  obj.property = value\n}\n\`\`\`\n\n3. Use optional chaining with optional coalescing:\n\`\`\`\n(obj ??= {}).property = value\n\`\`\``,
      docLink: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/undefined',
    },
    'CannotSetPropertyOfNull': {
      message: 'Cannot set properties of null',
      solution: `**How to fix:**\n\n1. Verify object is not null:\n\`\`\`\nif (obj !== null) {\n  obj.property = value\n}\n\`\`\`\n\n2. Initialize if null:\n\`\`\`\nif (!obj) {\n  obj = {}\n}\nobj.property = value\n\`\`\``,
      docLink: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/null',
    },

    // Function/Method errors
    'IsNotAFunction': {
      message: 'is not a function',
      solution: `## How to fix:\n\n### 1. Check if the method exists on the object\n\n\`\`\`javascript\n// ❌ Wrong - method doesn't exist\nconst section = interaction.components[0]\nsection.setThumbnailAccessory()\n\n// ✅ Right - use correct method\nconst section = new SectionBuilder()\n  .setThumbnail(...)\n\`\`\`\n\n### 2. Verify the method name is correct\n\n- Check discord.js documentation for the exact method name\n- Different versions may have different method names\n- Example: \`addComponents\` vs \`addTextDisplayComponents\`\n\n### 3. Use correct builder methods\n\n\`\`\`javascript\nconst section = new SectionBuilder()\n  .addTextDisplayComponents(...)\n  .addTextDisplayComponents(...)\n  .addSeparatorComponents(...)\n  .setThumbnail(...) // ✅ Correct\n  // NOT .setThumbnailAccessory()\n\`\`\``,
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/Builders:namespace',
    },
    'InteractionFieldsMethodError': {
      message: 'interaction.fields method not found',
      solution: `## ❌ The Problem:\n\nYou're using \`interaction.fields.getStringSelectValue()\` (singular) but the correct method is \`getStringSelectValues()\` (plural).\n\n## ✅ Available Modal Field Methods:\n\n### Text Input:\n- \`getTextInputValue(customId)\` - Get text input value\n\n### Select Menus:\n- \`getStringSelectValues(customId)\` - Get string select values (returns array)\n- \`getSelectedUsers(customId, required?)\` - Get selected users\n- \`getSelectedRoles(customId, required?)\` - Get selected roles\n- \`getSelectedChannels(customId, required?, channelTypes?)\` - Get selected channels\n- \`getSelectedMembers(customId)\` - Get selected members\n- \`getSelectedMentionables(customId, required?)\` - Get mentionables\n- \`getUploadedFiles(customId, required?)\` - Get uploaded files\n\n### General:\n- \`getField(customId, type)\` - Get the field object\n\n## ✅ Correct Example:\n\n\`\`\`javascript\nif (interaction.isModalSubmit()) {\n  // Text input\n  const username = interaction.fields.getTextInputValue('username_input')\n  \n  // String select (returns array)\n  const selections = interaction.fields.getStringSelectValues('select_menu')\n  console.log(selections[0]) // Get first selection\n  \n  // User select\n  const users = interaction.fields.getSelectedUsers('user_select')\n  console.log(users.first()) // Get first user\n}\n\`\`\`\n\n## Common Mistakes:\n\n- ❌ \`getStringSelectValue()\` - Singular (WRONG)\n- ✅ \`getStringSelectValues()\` - Plural (CORRECT)`,
      docLink: 'https://discord.js.org/docs/packages/discord.js/14.24.2/ModalSubmitInteraction:class#fields',
    },
  }

  // Detect discord.js error messages by pattern matching (using DiscordJSErrorCodes)
  const errorMessagePatterns = [
    // Client errors
    { pattern: /ClientInvalidToken/i, key: 'ClientInvalidToken' },
    { pattern: /ClientInvalidIntents/i, key: 'ClientInvalidIntents' },
    { pattern: /ClientMissingIntents/i, key: 'ClientMissingIntents' },
    { pattern: /ClientInvalidOption/i, key: 'ClientInvalidOption' },
    { pattern: /ClientNotReady/i, key: 'ClientNotReady' },

    // Interaction errors
    { pattern: /InteractionAlreadyReplied/i, key: 'InteractionAlreadyReplied' },
    { pattern: /already been sent or deferred/i, key: 'InteractionAlreadyReplied' },
    { pattern: /InteractionNotReplied/i, key: 'InteractionNotReplied' },
    { pattern: /InteractionEphemeralReplied/i, key: 'InteractionEphemeralReplied' },

    // Command errors
    { pattern: /CommandInteractionOptionNotFound/i, key: 'CommandInteractionOptionNotFound' },
    { pattern: /option.*not found/i, key: 'CommandInteractionOptionNotFound' },
    { pattern: /CommandInteractionOptionNotType/i, key: 'CommandInteractionOptionNotType' },
    { pattern: /ApplicationCommandOptionMissing/i, key: 'ApplicationCommandOptionMissing' },
    { pattern: /ApplicationCommandSubcommandInvalid/i, key: 'ApplicationCommandSubcommandInvalid' },

    // Builder/Structure errors
    { pattern: /ExpectedValidationError|your section has no accessory/i, key: 'SectionAccessoryError' },
    { pattern: /Expected:.*Received:|s\.instance\(V\)|CombinedError/i, key: 'ValidationError' },
    { pattern: /ValidationError/i, key: 'ValidationError' },

    // Guild/Channel/Member errors
    { pattern: /GuildMembersTimeout|Members didn't arrive in time/i, key: 'GuildMembersTimeout' },
    { pattern: /GuildChannelResolveError/i, key: 'GuildChannelResolveError' },
    { pattern: /GuildMemberResolveError|guild member.*not found/i, key: 'GuildMemberResolveError' },
    { pattern: /GuildRoleResolveError|role.*not found/i, key: 'GuildRoleResolveError' },
    { pattern: /GuildEmojiResolveError|emoji.*not found/i, key: 'GuildEmojiResolveError' },
    { pattern: /GuildStickerResolveError|sticker.*not found/i, key: 'GuildStickerResolveError' },

    // Collection errors
    { pattern: /CollectionError/i, key: 'CollectionError' },

    // Permission errors
    { pattern: /PermissionError|missing.*permission/i, key: 'PermissionError' },
    { pattern: /PermissionsFlagsBitsInvalid/i, key: 'PermissionsFlagsBitsInvalid' },

    // Message/Embed errors
    { pattern: /MessageBulkDeleteRateLimited/i, key: 'MessageBulkDeleteRateLimited' },
    { pattern: /MessageEmbedDescription|embed.*description.*long/i, key: 'MessageEmbedDescription' },

    // Voice errors
    { pattern: /VoiceChannelJoinFailed|failed.*join.*voice/i, key: 'VoiceChannelJoinFailed' },
    { pattern: /VoiceConnectionNotConnected|voice.*not.*connected/i, key: 'VoiceConnectionNotConnected' },

    // API/HTTP errors
    { pattern: /RESTInvalidVersion/i, key: 'RESTInvalidVersion' },
    { pattern: /RESTInvalidMethod/i, key: 'RESTInvalidMethod' },

    // Type errors
    { pattern: /DiscordJSError/i, key: 'DiscordJSError' },
    { pattern: /DiscordAPIError/i, key: 'DiscordAPIError' },
    { pattern: /DiscordRangeError/i, key: 'DiscordRangeError' },
    { pattern: /DiscordTypeError/i, key: 'DiscordTypeError' },
    { pattern: /InvalidType|invalid.*type/i, key: 'InvalidType' },
    { pattern: /InvalidToken/i, key: 'InvalidToken' },
    { pattern: /out of.*range|invalid.*range/i, key: 'RangeError' },

    // Common JavaScript errors
    { pattern: /Cannot read propert(ies|y) of undefined.*reading/i, key: 'CannotReadUndefined' },
    { pattern: /Cannot read propert(ies|y) of null.*reading/i, key: 'CannotReadNull' },
    { pattern: /Cannot set propert(ies|y).*of undefined/i, key: 'CannotSetPropertyOfUndefined' },
    { pattern: /Cannot set propert(ies|y).*of null/i, key: 'CannotSetPropertyOfNull' },
    { pattern: /is not a function|TypeError.*not a function/i, key: 'IsNotAFunction' },
    { pattern: /interaction\.fields\.getStringSelectValues?|getStringSelectValues? is not a function/i, key: 'InteractionFieldsMethodError' },
  ]

  // Track which error keys we've already added to avoid duplicates
  const addedErrorKeys = new Set<string>()

  for (const pattern of errorMessagePatterns) {
    if (pattern.pattern.test(code) && !addedErrorKeys.has(pattern.key)) {
      const errorInfo = djsErrorPatterns[pattern.key]
      if (errorInfo) {
        addedErrorKeys.add(pattern.key)
        suggestions.push({
          type: 'error',
          message: `discord.js Error: ${errorInfo.message}`,
          details: `${errorInfo.solution}`,
          docLink: errorInfo.docLink,
        })
      }
    }
  }

  return suggestions
}
