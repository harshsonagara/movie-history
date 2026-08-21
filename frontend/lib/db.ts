import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

function createClient(): PrismaClient | null {
  const url = process.env.DATABASE_URL
  if (!url || url.trim() === '') return null
  try {
    if (globalThis.prisma) return globalThis.prisma
    const adapter = new PrismaPg({ connectionString: url })
    const client = new PrismaClient({ adapter })
    if (process.env.NODE_ENV !== 'production') globalThis.prisma = client
    return client
  } catch {
    return null
  }
}

export const db = createClient()
