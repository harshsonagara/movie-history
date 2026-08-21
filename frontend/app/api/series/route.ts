import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  if (!db) return Response.json([])
  try {
    const series = await db.series.findMany({ orderBy: { updatedAt: 'desc' } })
    return Response.json(series)
  } catch {
    return Response.json([])
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!db) return Response.json({ ok: true, mock: true })
  try {
    const s = await db.series.upsert({
      where: { tmdbId: body.tmdbId },
      update: { status: body.status, rating: body.rating ?? null },
      create: {
        tmdbId: body.tmdbId,
        title:  body.title,
        poster: body.poster  ?? null,
        year:   body.year    ?? null,
        genre:  body.genre   ?? null,
        rating: body.rating  ?? null,
        status: body.status  ?? 'watching',
      },
    })
    // Log to history
    const action = s.status === 'watchlist' ? 'added' : 'started'
    await db.watchHistory.create({
      data: {
        mediaType: 'series',
        tmdbId:    s.tmdbId,
        title:     s.title,
        poster:    s.poster ?? null,
        action,
      },
    }).catch(() => {})
    return Response.json(s, { status: 201 })
  } catch {
    return Response.json({ error: 'DB unavailable' }, { status: 503 })
  }
}
