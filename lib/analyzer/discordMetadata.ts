import metadataJson from '@/data/discord-metadata.json'

export interface DiscordMetadata {
    version: string | null
    gatewayIntents: string[]
    builderMethods: Record<string, string[]>
    componentBuilders: string[]
}

const fallbackMetadata: DiscordMetadata = {
    version: null,
    gatewayIntents: [],
    builderMethods: {},
    componentBuilders: [],
}

const metadata: DiscordMetadata = {
    ...fallbackMetadata,
    ...(metadataJson as Partial<DiscordMetadata>),
}

export function getDiscordMetadata(): DiscordMetadata {
    return metadata
}

export function hasBuilderMethod(builder: string, method: string): boolean {
    const methods = metadata.builderMethods[builder] || []
    return methods.includes(method)
}

export function isComponentBuilder(builder: string): boolean {
    return metadata.componentBuilders.includes(builder)
}

export function getAvailableIntents(): Set<string> {
    return new Set(metadata.gatewayIntents)
}

/**
 * Return a documentation URL for a symbol.
 * - `symbol` is the class/enum/interface name (e.g. `Client`, `GatewayIntentBits`, `SlashCommandBuilder`).
 * - `pkg` is the docs package folder (defaults to `discord.js`, use `builders` for builders package).
 * - `kind` is one of `class|enum|interface|function` (defaults to `class`).
 */
export function getDocLink(symbol: string, pkg: 'discord.js' | 'builders' = 'discord.js', kind: 'class' | 'enum' | 'interface' | 'function' = 'class') {
    const packagePath = pkg === 'builders' ? 'builders' : 'discord.js'
    const versionSegment = metadata.version ? 'main' : 'main'
    // Use 'main' in docs URLs to point to latest stable documentation tree.
    return `https://discord.js.org/docs/packages/${packagePath}/main/${encodeURIComponent(symbol)}:${kind}`
}
