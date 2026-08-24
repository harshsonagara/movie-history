import { db } from '@/lib/db'
import { getFallbackMovies } from '@/lib/fallback-store'
import { getCurrentUserId } from '@/lib/auth-user'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!db) return Response.json(getFallbackMovies().filter(m => m.status === 'watchlist'))
  try {
    const items = await db.movie.findMany({ where: { userId, status: 'watchlist' }, orderBy: { watchedAt: 'desc' } })
    return Response.json(items)
  } catch {
    return Response.json([])
  }
}
