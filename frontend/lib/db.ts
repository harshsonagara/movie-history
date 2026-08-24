import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

declare global {
  var prisma: PrismaClient | undefined
}

function normalizeConnectionString(raw: string): string {
  try {
    const url = new URL(raw)
    if (url.protocol !== 'postgresql:' && url.protocol !== 'postgres:') return raw

    const sslmode = (url.searchParams.get('sslmode') ?? '').toLowerCase()
    if (sslmode === 'prefer' || sslmode === 'require' || sslmode === 'verify-ca') {
      // Preserve legacy/libpq-compatible behavior for providers using managed cert chains.
      url.searchParams.set('sslmode', 'require')
      url.searchParams.set('uselibpqcompat', 'true')
      return url.toString()
    }

    return raw
  } catch {
    return raw
  }
}

function createClient(): PrismaClient | null {
  const url = process.env.DATABASE_URL
  if (!url || url.trim() === '') return null
  try {
    if (globalThis.prisma) return globalThis.prisma
    const adapter = new PrismaPg({ connectionString: normalizeConnectionString(url) })
    const client = new PrismaClient({ adapter })
    if (process.env.NODE_ENV !== 'production') globalThis.prisma = client
    return client
  } catch {
    return null
  }
}

export const db = createClient()
