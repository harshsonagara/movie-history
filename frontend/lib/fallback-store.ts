type MediaStatusMovie = 'watched' | 'watching' | 'watchlist'
type MediaStatusSeries = 'watching' | 'completed' | 'watchlist'

type SeriesMeta = {
    totalSeasons?: number | null
    totalEpisodes?: number | null
    perSeasonEpisodes?: { season: number; episodes: number }[]
    progress?: {
        currentSeason?: number | null
        currentEpisode?: number | null
        note?: string | null
    }
}

type MovieItem = {
    id: number
    tmdbId: number
    title: string
    poster: string | null
    year: number | null
    genre: string | null
    rating: number | null
    runtime: number | null
    director: string | null
    overview: string | null
    status: MediaStatusMovie
    progress: number | null
    watchedAt: Date
    updatedAt: Date
}

type SeriesItem = {
    id: number
    tmdbId: number
    title: string
    poster: string | null
    year: number | null
    genre: string | null
    rating: number | null
    overview: string | null
    status: MediaStatusSeries
    seriesMeta: SeriesMeta | null
    currentSeason: number | null
    currentEp: number | null
    totalEps: number | null
    updatedAt: Date
}

type HistoryAction = 'watched' | 'rated' | 'added' | 'started'

type HistoryItem = {
    id: number
    mediaType: 'movie' | 'series'
    tmdbId: number
    title: string
    poster: string | null
    action: HistoryAction
    rating: number | null
    note: string | null
    createdAt: Date
}

let movies: MovieItem[] = []
let series: SeriesItem[] = []
let history: HistoryItem[] = []

let nextMovieId = 1
let nextSeriesId = 1
let nextHistoryId = 1

export function getFallbackMovies(): MovieItem[] {
    return [...movies].sort((a, b) => b.watchedAt.getTime() - a.watchedAt.getTime())
}

export function getFallbackSeries(): SeriesItem[] {
    return [...series].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
}

export function getFallbackHistory(): HistoryItem[] {
    return [...history].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
}

export function addFallbackHistory(input: Omit<HistoryItem, 'id' | 'createdAt'>): HistoryItem {
    const item: HistoryItem = {
        id: nextHistoryId++,
        createdAt: new Date(),
        ...input,
    }
    history.unshift(item)
    return item
}

export function upsertFallbackMovie(input: {
    tmdbId: number
    title: string
    poster?: string | null
    year?: number | null
    genre?: string | null
    rating?: number | null
    runtime?: number | null
    director?: string | null
    overview?: string | null
    status?: string
}): MovieItem {
    const now = new Date()
    const idx = movies.findIndex(m => m.tmdbId === input.tmdbId)
    const status: MediaStatusMovie =
        input.status === 'watching' || input.status === 'watchlist' || input.status === 'watched'
            ? input.status
            : 'watched'

    if (idx >= 0) {
        movies[idx] = {
            ...movies[idx],
            status,
            rating: input.rating ?? movies[idx].rating,
            updatedAt: now,
            watchedAt: now,
        }
        return movies[idx]
    }

    const item: MovieItem = {
        id: nextMovieId++,
        tmdbId: input.tmdbId,
        title: input.title,
        poster: input.poster ?? null,
        year: input.year ?? null,
        genre: input.genre ?? null,
        rating: input.rating ?? null,
        runtime: input.runtime ?? null,
        director: input.director ?? null,
        overview: input.overview ?? null,
        status,
        progress: null,
        watchedAt: now,
        updatedAt: now,
    }
    movies.unshift(item)
    return item
}

export function updateFallbackMovie(id: number, patch: {
    status?: string
    rating?: number | null
    progress?: number | null
}): MovieItem | null {
    const idx = movies.findIndex(m => m.id === id)
    if (idx < 0) return null

    const status =
        patch.status === 'watching' || patch.status === 'watchlist' || patch.status === 'watched'
            ? patch.status
            : undefined

    movies[idx] = {
        ...movies[idx],
        ...(status !== undefined ? { status } : {}),
        ...(patch.rating !== undefined ? { rating: patch.rating } : {}),
        ...(patch.progress !== undefined ? { progress: patch.progress } : {}),
        updatedAt: new Date(),
    }
    return movies[idx]
}

export function deleteFallbackMovie(id: number): boolean {
    const before = movies.length
    movies = movies.filter(m => m.id !== id)
    return movies.length < before
}

export function upsertFallbackSeries(input: {
    tmdbId: number
    title: string
    poster?: string | null
    year?: number | null
    genre?: string | null
    rating?: number | null
    overview?: string | null
    seriesMeta?: SeriesMeta | null
    status?: string
    currentSeason?: number | null
    currentEp?: number | null
    totalEps?: number | null
}): SeriesItem {
    const now = new Date()
    const idx = series.findIndex(s => s.tmdbId === input.tmdbId)
    const status: MediaStatusSeries =
        input.status === 'completed' || input.status === 'watchlist' || input.status === 'watching'
            ? input.status
            : 'watching'

    if (idx >= 0) {
        const nextMeta = input.seriesMeta ?? series[idx].seriesMeta
        series[idx] = {
            ...series[idx],
            status,
            rating: input.rating ?? series[idx].rating,
            seriesMeta: nextMeta,
            currentSeason: input.currentSeason ?? series[idx].currentSeason,
            currentEp: input.currentEp ?? series[idx].currentEp,
            totalEps: input.totalEps ?? series[idx].totalEps,
            updatedAt: now,
        }
        return series[idx]
    }

    const item: SeriesItem = {
        id: nextSeriesId++,
        tmdbId: input.tmdbId,
        title: input.title,
        poster: input.poster ?? null,
        year: input.year ?? null,
        genre: input.genre ?? null,
        rating: input.rating ?? null,
        overview: input.overview ?? null,
        status,
        seriesMeta: input.seriesMeta ?? null,
        currentSeason: input.currentSeason ?? null,
        currentEp: input.currentEp ?? null,
        totalEps: input.totalEps ?? null,
        updatedAt: now,
    }
    series.unshift(item)
    return item
}

export function updateFallbackSeries(id: number, patch: {
    status?: string
    rating?: number | null
    seriesMeta?: SeriesMeta | null
    currentSeason?: number | null
    currentEp?: number | null
    totalEps?: number | null
}): SeriesItem | null {
    const idx = series.findIndex(s => s.id === id)
    if (idx < 0) return null

    const status =
        patch.status === 'completed' || patch.status === 'watchlist' || patch.status === 'watching'
            ? patch.status
            : undefined

    series[idx] = {
        ...series[idx],
        ...(status !== undefined ? { status } : {}),
        ...(patch.rating !== undefined ? { rating: patch.rating } : {}),
        ...(patch.seriesMeta !== undefined ? { seriesMeta: patch.seriesMeta } : {}),
        ...(patch.currentSeason !== undefined ? { currentSeason: patch.currentSeason } : {}),
        ...(patch.currentEp !== undefined ? { currentEp: patch.currentEp } : {}),
        ...(patch.totalEps !== undefined ? { totalEps: patch.totalEps } : {}),
        updatedAt: new Date(),
    }
    return series[idx]
}

export function deleteFallbackSeries(id: number): boolean {
    const before = series.length
    series = series.filter(s => s.id !== id)
    return series.length < before
}
