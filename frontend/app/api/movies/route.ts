import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  if (!db) return Response.json([])
  try {
    const movies = await db.movie.findMany({ orderBy: { watchedAt: 'desc' } })
    return Response.json(movies)
  } catch {
    return Response.json([])
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!db) return Response.json({ ok: true, mock: true })
  try {
    const movie = await db.movie.upsert({
      where: { tmdbId: body.tmdbId },
      update: { status: body.status, rating: body.rating ?? null },
      create: {
        tmdbId:   body.tmdbId,
        title:    body.title,
        poster:   body.poster   ?? null,
        year:     body.year     ?? null,
        genre:    body.genre    ?? null,
        rating:   body.rating   ?? null,
        runtime:  body.runtime  ?? null,
        director: body.director ?? null,
        status:   body.status   ?? 'watched',
      },
    })
    // Log to history
    const action = movie.status === 'watchlist' ? 'added' : 'watched'
    await db.watchHistory.create({
      data: {
        mediaType: 'movie',
        tmdbId:    movie.tmdbId,
        title:     movie.title,
        poster:    movie.poster ?? null,
        action,
        rating:    movie.rating ?? null,
      },
    }).catch(() => {})
    return Response.json(movie, { status: 201 })
  } catch {
    return Response.json({ error: 'DB unavailable' }, { status: 503 })
  }
}
