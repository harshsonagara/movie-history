import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { addFallbackHistory, getFallbackMovies, upsertFallbackMovie } from '@/lib/fallback-store'
import { getCurrentUserId } from '@/lib/auth-user'

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
  const userId = await getCurrentUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (!db) {
    const movie = upsertFallbackMovie({
      tmdbId: body.tmdbId,
      title: body.title,
      poster: body.poster ?? null,
      year: body.year ?? null,
      genre: body.genre ?? null,
      rating: body.rating ?? null,
      runtime: body.runtime ?? null,
      director: body.director ?? null,
      overview: body.overview ?? null,
      status: body.status ?? 'watched',
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
      where: { userId_tmdbId: { userId, tmdbId: Number(body.tmdbId) } },
      update: {
        status: body.status,
        rating: body.rating ?? null,
        genre: body.genre ?? undefined,
        runtime: body.runtime ?? undefined,
        director: body.director ?? undefined,
        overview: body.overview ?? undefined,
      },
      create: {
        tmdbId: body.tmdbId,
        userId,
        title: body.title,
        poster: body.poster ?? null,
        year: body.year ?? null,
        genre: body.genre ?? null,
        rating: body.rating ?? null,
        runtime: body.runtime ?? null,
        director: body.director ?? null,
        overview: body.overview ?? null,
        status: body.status ?? 'watched',
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
