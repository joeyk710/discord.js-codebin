import fs from 'fs'
import path from 'path'
import ts from 'typescript'

interface DiscordMetadata {
    version: string | null
    gatewayIntents: string[]
    builderMethods: Record<string, string[]>
    componentBuilders: string[]
}

const rootDir = process.cwd()

const builderAliasMap: Record<string, string> = {
    SlashCommandBuilder: 'SharedNameAndDescription',
}

function resolvePackagePath(pkg: string, subPath: string): string | null {
    const candidate = path.join(rootDir, 'node_modules', pkg, ...subPath.split('/'))
    return fs.existsSync(candidate) ? candidate : null
}

function readSourceFile(filePath: string | null): ts.SourceFile | null {
    if (!filePath || !fs.existsSync(filePath)) return null
    const content = fs.readFileSync(filePath, 'utf8')
    return ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
}

function collectEnumMembers(source: ts.SourceFile | null, enumName: string): string[] {
    if (!source) return []
    const members = new Set<string>()

    const visit = (node: ts.Node) => {
        if (ts.isEnumDeclaration(node) && node.name.text === enumName) {
            node.members.forEach(member => {
                if (ts.isIdentifier(member.name)) {
                    members.add(member.name.text)
                }
            })
        }
        ts.forEachChild(node, visit)
    }

    ts.forEachChild(source, visit)
    return Array.from(members)
}

function collectClassMethods(source: ts.SourceFile | null, className: string): string[] {
    if (!source) return []
    const methods = new Set<string>()

    const visit = (node: ts.Node) => {
        if ((ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) && node.name?.text === className) {
            node.members.forEach(member => {
                if ('name' in member && member.name && ts.isIdentifier(member.name)) {
                    if (ts.isMethodDeclaration(member) || ts.isMethodSignature(member)) {
                        methods.add(member.name.text)
                    }
                }
            })
        }
        ts.forEachChild(node, visit)
    }

    ts.forEachChild(source, visit)
    return Array.from(methods)
}

function collectComponentBuilders(builderTargets: string[]): string[] {
    return builderTargets.filter(name => name !== 'ActionRowBuilder')
}

function getDiscordVersion(): string | null {
    try {
        const pkgPath = path.join(rootDir, 'node_modules', 'discord.js', 'package.json')
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))
        return pkg.version || null
    } catch {
        return null
    }
}

function main() {
    const discordTypings = readSourceFile(resolvePackagePath('discord.js', 'typings/index.d.ts'))
    const apiTypesTypings = readSourceFile(
        resolvePackagePath('discord-api-types', 'gateway/v10.d.ts') ||
        resolvePackagePath('discord-api-types', 'v10.d.ts')
    )
    const buildersTypings = readSourceFile(resolvePackagePath('@discordjs/builders', 'dist/index.d.ts'))

    const gatewayIntentsSource = collectEnumMembers(discordTypings, 'GatewayIntentBits')
    const gatewayIntents = gatewayIntentsSource.length ? gatewayIntentsSource : collectEnumMembers(apiTypesTypings, 'GatewayIntentBits')

    const builderTargets = [
        'SlashCommandBuilder',
        'ButtonBuilder',
        'ModalBuilder',
        'TextInputBuilder',
        'ActionRowBuilder',
        'StringSelectMenuBuilder',
        'UserSelectMenuBuilder',
        'RoleSelectMenuBuilder',
        'ChannelSelectMenuBuilder',
        'MentionableSelectMenuBuilder',
    ]

    const builderMethods: Record<string, string[]> = {}
    for (const className of builderTargets) {
        const target = builderAliasMap[className] ?? className
        builderMethods[className] = collectClassMethods(buildersTypings, target)
    }

    const componentBuilders = collectComponentBuilders(builderTargets)

    const metadata: DiscordMetadata = {
        version: getDiscordVersion(),
        gatewayIntents,
        builderMethods,
        componentBuilders,
    }

    const outputDir = path.join(rootDir, 'data')
    fs.mkdirSync(outputDir, { recursive: true })
    const outputPath = path.join(outputDir, 'discord-metadata.json')
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2))
    console.log(`✅ Discord metadata extracted to ${path.relative(rootDir, outputPath)}`)
}

main()
