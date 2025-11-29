import { PrismaClient } from '../prisma/generated/client';
import { PrismaPg } from '@prisma/adapter-pg';

function isAccelerateUrl(url?: string) {
  if (!url) return false
  return url.startsWith('prisma+') || url.includes('accelerate.prisma-data.net')
}

const databaseUrl = process.env.DATABASE_URL

let prisma: PrismaClient

if (isAccelerateUrl(databaseUrl)) {
  prisma = new PrismaClient({
    // For Prisma Accelerate use `accelerateUrl` instead of adapter
    // @ts-ignore - accelerateUrl supported at runtime
    accelerateUrl: databaseUrl as string,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })
} else {
  const adapter = new PrismaPg({
    connectionString: databaseUrl,
  })

  prisma = new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })
}

const globalForPrisma = global as unknown as { prisma?: PrismaClient }

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export { prisma }