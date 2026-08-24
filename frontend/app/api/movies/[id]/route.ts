import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { addFallbackHistory, deleteFallbackMovie, updateFallbackMovie } from '@/lib/fallback-store'
import { getCurrentUserId } from '@/lib/auth-user'
import { asInt, asNullableNumber, asTrimmedString, limitRequest, parseJsonObjectBody, validateStatus } from '@/lib/api-guard'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = limitRequest(req, 'movies-patch', { windowMs: 60_000, max: 80 })
  if (rateLimited) return rateLimited

  const userId = await getCurrentUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const movieId = asInt(id)
  if (!movieId || movieId <= 0) return Response.json({ error: 'Invalid id' }, { status: 400 })

  const parsed = await parseJsonObjectBody(req)
  if (!parsed.ok) return parsed.response
  const body = parsed.body
  let status: string | undefined
  if (body.status !== undefined) {
    const nextStatus = validateStatus(body.status, ['watched', 'watching', 'watchlist'])
    if (!nextStatus) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }
    status = nextStatus
  }
  const rating = asNullableNumber(body.rating)
  const progress = asNullableNumber(body.progress)
  const notes = body.notes === undefined ? undefined : body.notes === null ? null : asTrimmedString(body.notes)
  if (rating !== undefined && rating !== null && (rating < 0 || rating > 10)) {
    return Response.json({ error: 'rating must be between 0 and 10' }, { status: 400 })
  }

  if (!db) {
    const movie = updateFallbackMovie(movieId, {
      status,
      rating,
      progress,
      notes,
    })
    if (!movie) return Response.json({ error: 'Not found' }, { status: 404 })
    if (body.status === 'watched') {
      addFallbackHistory({
        mediaType: 'movie',
        tmdbId: movie.tmdbId,
        title: movie.title,
        poster: movie.poster ?? null,
        action: 'watched',
        rating: movie.rating ?? null,
        note: null,
      })
    }
    return Response.json(movie)
  }
  try {
    const existing = await db.movie.findFirst({ where: { id: movieId, userId } })
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

    const movie = await db.movie.update({
      where: { id: movieId },
      data: {
        ...(status !== undefined && { status }),
        ...(rating !== undefined && { rating }),
        ...(progress !== undefined && { progress }),
        ...(notes !== undefined && { notes }),
      },
    })
    // Log to history when marked as watched
    if (body.status === 'watched') {
      await db.watchHistory.create({
        data: {
          mediaType: 'movie',
          userId,
          tmdbId: movie.tmdbId,
          title: movie.title,
          poster: movie.poster ?? null,
          action: 'watched',
          rating: movie.rating ?? null,
        },
      }).catch(() => { })
    }
    return Response.json(movie)
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = limitRequest(_req, 'movies-delete', { windowMs: 60_000, max: 40 })
  if (rateLimited) return rateLimited

  const userId = await getCurrentUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const movieId = asInt(id)
  if (!movieId || movieId <= 0) return Response.json({ error: 'Invalid id' }, { status: 400 })

  if (!db) {
    const ok = deleteFallbackMovie(movieId)
    if (!ok) return Response.json({ error: 'Not found' }, { status: 404 })
    return new Response(null, { status: 204 })
  }
  try {
    const result = await db.movie.deleteMany({ where: { id: movieId, userId } })
    if (result.count === 0) return Response.json({ error: 'Not found' }, { status: 404 })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}
