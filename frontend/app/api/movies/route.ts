import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { MOCK_MOVIES } from '@/lib/mock-data'

export async function GET() {
  if (!db) return Response.json(MOCK_MOVIES)
  const movies = await db.movie.findMany({ orderBy: { watchedAt: 'desc' } })
  return Response.json(movies)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!db) return Response.json({ ok: true, mock: true })
  const movie = await db.movie.upsert({
    where: { tmdbId: body.tmdbId },
    update: { status: body.status, rating: body.rating ?? null },
    create: {
      tmdbId:   body.tmdbId,
      title:    body.title,
      poster:   body.poster ?? null,
      year:     body.year   ?? null,
      genre:    body.genre  ?? null,
      rating:   body.rating ?? null,
      runtime:  body.runtime ?? null,
      director: body.director ?? null,
      status:   body.status ?? 'watched',
    },
  })
  return Response.json(movie, { status: 201 })
}
