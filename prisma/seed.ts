import 'dotenv/config'
import { PrismaClient } from '../prisma/generated/client'
import { PrismaPg } from '@prisma/adapter-pg'

function isAccelerateUrl(url?: string) {
    if (!url) return false
    return url.startsWith('prisma+') || url.includes('accelerate.prisma-data.net')
}

const databaseUrl = process.env.DATABASE_URL

let prisma: PrismaClient

if (isAccelerateUrl(databaseUrl)) {
    // Use accelerateUrl when the DATABASE_URL points to Prisma Accelerate
    // PrismaClient accepts `accelerateUrl` instead of an adapter in that case
    prisma = new PrismaClient({
        accelerateUrl: databaseUrl as string,
    })
} else {
    const adapter = new PrismaPg({ connectionString: databaseUrl! })
    prisma = new PrismaClient({ adapter })
}

async function main() {
    // Example seed: create one sample Project (adjust fields as-needed)
    await prisma.project.create({
        data: {
            title: 'Seed Project',
            description: 'Generated seed for Prisma v7 migration',
        },
    })
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
