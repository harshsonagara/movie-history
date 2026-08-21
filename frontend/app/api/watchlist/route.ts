import { db } from '@/lib/db'
import { MOCK_MOVIES } from '@/lib/mock-data'

export async function GET() {
  if (!db) return Response.json(MOCK_MOVIES.filter(m => m.status === 'watchlist'))
  const items = await db.movie.findMany({ where: { status: 'watchlist' }, orderBy: { watchedAt: 'desc' } })
  return Response.json(items)
}
