import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { addFallbackHistory, getFallbackMovies, upsertFallbackMovie } from '@/lib/fallback-store'
import { getCurrentUserId } from '@/lib/auth-user'
import { asNullableNumber, asNumber, asTrimmedString, limitRequest, parseJsonObjectBody, validateStatus } from '@/lib/api-guard'

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!db) return Response.json(getFallbackMovies())
  try {
    const movies = await db.movie.findMany({ where: { userId }, orderBy: { watchedAt: 'desc' } })
    return Response.json(movies)
  } catch {
    return Response.json([])
  }
}

export async function POST(req: NextRequest) {
  const rateLimited = limitRequest(req, 'movies-post', { windowMs: 60_000, max: 40 })
  if (rateLimited) return rateLimited

  const userId = await getCurrentUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = await parseJsonObjectBody(req)
  if (!parsed.ok) return parsed.response
  const body = parsed.body

  const tmdbId = asNumber(body.tmdbId)
  const title = asTrimmedString(body.title)
  const status = validateStatus(body.status, ['watched', 'watching', 'watchlist']) ?? 'watched'
  const rating = asNullableNumber(body.rating)
  const year = asNullableNumber(body.year)
  const runtime = asNullableNumber(body.runtime)
  const poster = body.poster === null ? null : asTrimmedString(body.poster)
  const genre = body.genre === null ? null : asTrimmedString(body.genre)
  const director = body.director === null ? null : asTrimmedString(body.director)
  const overview = body.overview === null ? null : asTrimmedString(body.overview)

  if (!tmdbId || tmdbId <= 0 || !title) {
    return Response.json({ error: 'tmdbId and title are required' }, { status: 400 })
  }
  if (rating !== undefined && rating !== null && (rating < 0 || rating > 10)) {
    return Response.json({ error: 'rating must be between 0 and 10' }, { status: 400 })
  }

  if (!db) {
    const movie = upsertFallbackMovie({
      tmdbId,
      title,
      poster: poster ?? null,
      year: year ?? null,
      genre: genre ?? null,
      rating: rating ?? null,
      runtime: runtime ?? null,
      director: director ?? null,
      overview: overview ?? null,
      status,
    })
    addFallbackHistory({
      mediaType: 'movie',
      tmdbId: movie.tmdbId,
      title: movie.title,
      poster: movie.poster ?? null,
      action: movie.status === 'watchlist' ? 'added' : 'watched',
      rating: movie.rating ?? null,
      note: null,
    })
    return Response.json(movie, { status: 201 })
  }
  try {
    const movie = await db.movie.upsert({
      where: { userId_tmdbId: { userId, tmdbId } },
      update: {
        status,
        rating: rating ?? null,
        genre: genre ?? undefined,
        runtime: runtime ?? undefined,
        director: director ?? undefined,
        overview: overview ?? undefined,
      },
      create: {
        tmdbId,
        userId,
        title,
        poster: poster ?? null,
        year: year ?? null,
        genre: genre ?? null,
        rating: rating ?? null,
        runtime: runtime ?? null,
        director: director ?? null,
        overview: overview ?? null,
        status,
      },
    })
    // Log to history
    const action = movie.status === 'watchlist' ? 'added' : 'watched'
    await db.watchHistory.create({
      data: {
        mediaType: 'movie',
        userId,
        tmdbId: movie.tmdbId,
        title: movie.title,
        poster: movie.poster ?? null,
        action,
        rating: movie.rating ?? null,
      },
    }).catch(() => { })
    return Response.json(movie, { status: 201 })
  } catch {
    return Response.json({ error: 'DB unavailable' }, { status: 503 })
  }
}
