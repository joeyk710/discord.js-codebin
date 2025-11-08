import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export interface PasteData {
  id: string
  code: string
  title?: string | null
  description?: string | null
  language: string
  createdAt: Date
  views: number
  isPublic: boolean
}

export async function createPaste(paste: Omit<PasteData, 'createdAt' | 'views' | 'id'>): Promise<PasteData> {
  const created = await prisma.paste.create({
    data: {
      code: paste.code,
      title: paste.title,
      description: paste.description,
      language: paste.language,
      isPublic: paste.isPublic,
    },
  })

  return {
    id: created.id,
    code: created.code,
    title: created.title,
    description: created.description,
    language: created.language,
    createdAt: created.createdAt,
    views: created.views,
    isPublic: created.isPublic,
  }
}

export async function getPaste(id: string): Promise<PasteData | null> {
  const paste = await prisma.paste.findUnique({
    where: { id },
  })

  if (!paste) return null

  // Increment views
  await prisma.paste.update({
    where: { id },
    data: { views: { increment: 1 } },
  })

  return {
    id: paste.id,
    code: paste.code,
    title: paste.title,
    description: paste.description,
    language: paste.language,
    createdAt: paste.createdAt,
    views: paste.views + 1,
    isPublic: paste.isPublic,
  }
}

export async function getPublicPastes(limit = 50, offset = 0): Promise<PasteData[]> {
  const pastes = await prisma.paste.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
  })

  return pastes.map((p: typeof pastes[number]): PasteData => ({
    id: p.id,
    code: p.code,
    title: p.title,
    description: p.description,
    language: p.language,
    createdAt: p.createdAt,
    views: p.views,
    isPublic: p.isPublic,
  }))
}

export async function deletePaste(id: string): Promise<boolean> {
  const result = await prisma.paste.delete({
    where: { id },
  })

  return !!result
}

export async function updatePaste(
  id: string,
  updates: Partial<Omit<PasteData, 'id' | 'createdAt' | 'views'>>
): Promise<PasteData | null> {
  const updated = await prisma.paste.update({
    where: { id },
    data: {
      code: updates.code,
      title: updates.title,
      description: updates.description,
      language: updates.language,
      isPublic: updates.isPublic,
    },
  })

  return {
    id: updated.id,
    code: updated.code,
    title: updated.title,
    description: updated.description,
    language: updated.language,
    createdAt: updated.createdAt,
    views: updated.views,
    isPublic: updated.isPublic,
  }
}