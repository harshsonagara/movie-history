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
    return Response.json(s, { status: 201 })
  } catch {
    return Response.json({ error: 'DB unavailable' }, { status: 503 })
  }
}
