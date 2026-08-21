import { db } from './db'

async function q<T>(fn: () => Promise<T>, fallback: any): Promise<T> {
  if (!db) return fallback
  try { return await fn() } catch { return fallback }
}

export async function getMovies() {
  return q(() => db!.movie.findMany({ orderBy: { watchedAt: 'desc' } }), [])
}

export async function getSeries() {
  return q(() => db!.series.findMany({ orderBy: { updatedAt: 'desc' } }), [])
}

export async function getWatchlist() {
  return q(
    () => db!.movie.findMany({ where: { status: 'watchlist' }, orderBy: { watchedAt: 'desc' } }),
    [],
  )
}

export async function getHistory() {
  return q(
    () => db!.watchHistory.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    [],
  )
}

export async function getStats() {
  if (!db) return EMPTY_STATS
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
      moviesWatched: movies.filter(m => m.status === 'watched').length,
      showsTracked: series.length,
      hoursWatched: Math.round(totalMin / 60),
      avgRating: Math.round(avgRating * 10) / 10,
      ratedCount: rated.length,
      currentlyWatching: series.filter(s => s.status === 'watching').length,
      monthlyData: [] as { month: string; count: number }[],
      genres: [] as { name: string; percent: number; color: string }[],
      ratingDistribution: [] as { rating: number; count: number }[],
      topDirectors: [] as { name: string; films: number; avgRating: number }[],
    }
  } catch {
    return EMPTY_STATS
  }
}

const EMPTY_STATS = {
  moviesWatched: 0, showsTracked: 0, hoursWatched: 0, avgRating: 0,
  ratedCount: 0, currentlyWatching: 0,
  monthlyData: [] as { month: string; count: number }[],
  genres: [] as { name: string; percent: number; color: string }[],
  ratingDistribution: [] as { rating: number; count: number }[],
  topDirectors: [] as { name: string; films: number; avgRating: number }[],
}

export type TrendingItem = {
  id: number
  media_type: 'movie' | 'tv'
  title?: string
  name?: string
  poster_path?: string | null
  release_date?: string
  first_air_date?: string
  vote_average?: number
}

export async function getTrending(): Promise<TrendingItem[]> {
  const token = process.env.TMDB_BEARER_TOKEN
  if (!token) return []
  try {
    const res = await fetch('https://api.tmdb.org/3/trending/all/week', {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    })
    const data = await res.json()
    return (data.results ?? []).slice(0, 10)
  } catch { return [] }
}
