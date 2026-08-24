import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { addFallbackHistory, deleteFallbackMovie, updateFallbackMovie } from '@/lib/fallback-store'
import { getCurrentUserId } from '@/lib/auth-user'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const userId = await getCurrentUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  if (!db) {
    const movie = updateFallbackMovie(parseInt(id), {
      status: body.status,
      rating: body.rating === undefined ? undefined : body.rating === null ? null : Number(body.rating),
      progress: body.progress === undefined ? undefined : body.progress === null ? null : Number(body.progress),
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
    const movieId = parseInt(id)
    const existing = await db.movie.findFirst({ where: { id: movieId, userId } })
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

    const movie = await db.movie.update({
      where: { id: movieId },
      data: {
        ...(body.status !== undefined && { status: body.status }),
        ...(body.rating !== undefined && { rating: body.rating === null ? null : Number(body.rating) }),
        ...(body.progress !== undefined && { progress: Number(body.progress) }),
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
  const userId = await getCurrentUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  if (!db) {
    const ok = deleteFallbackMovie(parseInt(id))
    if (!ok) return Response.json({ error: 'Not found' }, { status: 404 })
    return new Response(null, { status: 204 })
  }
  try {
    const movieId = parseInt(id)
    const result = await db.movie.deleteMany({ where: { id: movieId, userId } })
    if (result.count === 0) return Response.json({ error: 'Not found' }, { status: 404 })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}
