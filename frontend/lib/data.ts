import { db } from './db'
import { getFallbackHistory, getFallbackMovies, getFallbackSeries } from './fallback-store'
import { getCurrentUserId } from './auth-user'

async function q<T>(fn: () => Promise<T>, fallback: any): Promise<T> {
  if (!db) return fallback
  try { return await fn() } catch { return fallback }
}

export async function getMovies() {
  const userId = await getCurrentUserId()
  if (!userId) return []
  if (!db) return getFallbackMovies()
  return q(() => db!.movie.findMany({ where: { userId }, orderBy: { watchedAt: 'desc' } }), [])
}

export async function getSeries() {
  const userId = await getCurrentUserId()
  if (!userId) return []
  if (!db) return getFallbackSeries()
  return q(() => db!.series.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }), [])
}

export async function getWatchlist() {
  const userId = await getCurrentUserId()
  if (!userId) return []
  if (!db) return getFallbackMovies().filter(m => m.status === 'watchlist')
  return q(
    () => db!.movie.findMany({ where: { userId, status: 'watchlist' }, orderBy: { watchedAt: 'desc' } }),
    [],
  )
}

export async function getHistory() {
  const userId = await getCurrentUserId()
  if (!userId) return []
  if (!db) return getFallbackHistory()
  return q(
    () => db!.watchHistory.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 100 }),
    [],
  )
}

const GENRE_COLORS = ['#f5a623', '#4a9eff', '#b794f4', '#48bb78', '#f6ad55', '#718096', '#fc8181']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export async function getStats() {
  const userId = await getCurrentUserId()
  if (!userId) return EMPTY_STATS
  if (!db) {
    const movies = getFallbackMovies()
    const series = getFallbackSeries()
    return buildStats(movies, series)
  }
  try {
    const [movies, series] = await Promise.all([
      db.movie.findMany({ where: { userId } }),
      db.series.findMany({ where: { userId } }),
    ])
    return buildStats(movies, series)
  } catch {
    return EMPTY_STATS
  }
}

function buildStats(movies: { status: string; rating?: number | null; runtime?: number | null; watchedAt: Date; genre?: string | null; director?: string | null }[], series: { status: string; genre?: string | null }[]) {
  const rated = movies.filter(m => m.rating != null)
  const avgRating = rated.length
    ? rated.reduce((s, m) => s + (m.rating ?? 0), 0) / rated.length : 0
  const totalMin = movies.filter(m => m.status === 'watched')
    .reduce((s, m) => s + (m.runtime ?? 90), 0)
  const watchlistCount = movies.filter(m => m.status === 'watchlist').length
    + series.filter(s => s.status === 'watchlist').length

  const now = new Date()
  const year = now.getFullYear()
  const monthlyCounts = new Array(12).fill(0)
  for (const m of movies) {
    if (m.status === 'watched') {
      const d = new Date(m.watchedAt)
      if (d.getFullYear() === year) monthlyCounts[d.getMonth()]++
    }
  }
  const monthlyData = MONTHS.slice(0, now.getMonth() + 1)
    .map((month, i) => ({ month, count: monthlyCounts[i] }))

  const genreCount: Record<string, number> = {}
  for (const item of [...movies, ...series]) {
    if (item.genre) genreCount[item.genre] = (genreCount[item.genre] ?? 0) + 1
  }
  const genreTotal = Object.values(genreCount).reduce((s, c) => s + c, 0) || 1
  const genres = Object.entries(genreCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 7)
    .map(([name, count], i) => ({
      name,
      percent: Math.round((count / genreTotal) * 100),
      color: GENRE_COLORS[i] ?? '#718096',
    }))

  const ratingBuckets: Record<number, number> = {}
  for (const m of movies) {
    if (m.rating != null) {
      const r = Math.round(m.rating)
      ratingBuckets[r] = (ratingBuckets[r] ?? 0) + 1
    }
  }
  const ratingDistribution = [10, 9, 8, 7, 6, 5, 4, 3]
    .filter(r => ratingBuckets[r])
    .map(rating => ({ rating, count: ratingBuckets[rating] }))

  const dirMap: Record<string, { films: number; total: number }> = {}
  for (const m of movies) {
    if (m.director && m.status === 'watched') {
      if (!dirMap[m.director]) dirMap[m.director] = { films: 0, total: 0 }
      dirMap[m.director].films++
      if (m.rating) dirMap[m.director].total += m.rating
    }
  }
  const topDirectors = Object.entries(dirMap)
    .map(([name, { films, total }]) => ({
      name, films, avgRating: Math.round((total / films) * 10) / 10,
    }))
    .sort((a, b) => b.films - a.films || b.avgRating - a.avgRating)
    .slice(0, 5)

  return {
    moviesWatched: movies.filter(m => m.status === 'watched').length,
    showsTracked: series.length,
    hoursWatched: Math.round(totalMin / 60),
    avgRating: Math.round(avgRating * 10) / 10,
    ratedCount: rated.length,
    currentlyWatching: series.filter(s => s.status === 'watching').length,
    watchlistCount,
    monthlyData,
    genres,
    ratingDistribution,
    topDirectors,
  }
}

const EMPTY_STATS = {
  moviesWatched: 0, showsTracked: 0, hoursWatched: 0, avgRating: 0,
  ratedCount: 0, currentlyWatching: 0, watchlistCount: 0,
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
