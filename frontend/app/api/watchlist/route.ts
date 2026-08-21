import { db } from '@/lib/db'

export async function GET() {
  if (!db) return Response.json([])
  try {
    const items = await db.movie.findMany({ where: { status: 'watchlist' }, orderBy: { watchedAt: 'desc' } })
    return Response.json(items)
  } catch {
    return Response.json([])
  }
}
