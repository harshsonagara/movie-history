const BASE = 'https://api.themoviedb.org/3'
export const IMG = 'https://image.tmdb.org/t/p/w500'
export const IMG_LG = 'https://image.tmdb.org/t/p/original'

function auth() {
  const token = process.env.TMDB_BEARER_TOKEN
  if (!token) throw new Error('TMDB_BEARER_TOKEN not set')
  return { Authorization: `Bearer ${token}`, accept: 'application/json' }
}

async function tmdb(path: string, params: Record<string, string> = {}) {
  const url = new URL(BASE + path)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { headers: auth(), next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`TMDB ${res.status}: ${path}`)
  return res.json()
}

export async function searchTMDB(query: string) {
  return tmdb('/search/multi', { query, include_adult: 'false', language: 'en-US', page: '1' })
}

export async function getTrending(type: 'movie' | 'tv' | 'all' = 'all', window: 'day' | 'week' = 'week') {
  return tmdb(`/trending/${type}/${window}`, { language: 'en-US' })
}

export async function getMovieDetails(id: number) {
  return tmdb(`/movie/${id}`, { language: 'en-US' })
}

export async function getTVDetails(id: number) {
  return tmdb(`/tv/${id}`, { language: 'en-US' })
}

export async function discoverMovies(params: Record<string, string> = {}) {
  return tmdb('/discover/movie', { language: 'en-US', sort_by: 'popularity.desc', ...params })
}
