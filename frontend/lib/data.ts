import { db } from './db'
import { MOCK_MOVIES, MOCK_SERIES, MOCK_HISTORY, MOCK_STATS } from './mock-data'

// ponytail: fallback is `any` so mock-data shapes don't need to mirror Prisma's generated types
async function q<T>(fn: () => Promise<T>, fallback: any): Promise<T> {
  if (!db) return fallback
  try { return await fn() } catch { return fallback }
}

export async function getMovies() {
  return q(() => db!.movie.findMany({ orderBy: { watchedAt: 'desc' } }), MOCK_MOVIES)
}

export async function getSeries() {
  return q(() => db!.series.findMany({ orderBy: { updatedAt: 'desc' } }), MOCK_SERIES)
}

export async function getWatchlist() {
  return q(
    () => db!.movie.findMany({ where: { status: 'watchlist' }, orderBy: { watchedAt: 'desc' } }),
    MOCK_MOVIES.filter(m => m.status === 'watchlist'),
  )
}

export async function getHistory() {
  return q(
    () => db!.watchHistory.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    MOCK_HISTORY,
  )
}

export async function getStats() {
  if (!db) return MOCK_STATS
  try {
    const [movies, series] = await Promise.all([
      db.movie.findMany(),
      db.series.findMany(),
    ])
    const rated = movies.filter(m => m.rating != null)
    const avgRating = rated.length
      ? rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length
      : 0
    const totalMin = movies.reduce((s, m) => s + (m.runtime ?? 90), 0)
    return {
      ...MOCK_STATS,
      moviesWatched: movies.filter(m => m.status === 'watched').length,
      showsTracked: series.length,
      hoursWatched: Math.round(totalMin / 60),
      avgRating: Math.round(avgRating * 10) / 10,
      ratedCount: rated.length,
      currentlyWatching: series.filter(s => s.status === 'watching').length,
    }
  } catch {
    return MOCK_STATS
  }
}
