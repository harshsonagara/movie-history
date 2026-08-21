import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  if (!db) return Response.json({ error: 'DB unavailable' }, { status: 503 })
  try {
    const s = await db.series.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.status        !== undefined && { status: body.status }),
        ...(body.rating        !== undefined && { rating: body.rating === null ? null : Number(body.rating) }),
        ...(body.currentSeason !== undefined && { currentSeason: Number(body.currentSeason) }),
        ...(body.currentEp     !== undefined && { currentEp: Number(body.currentEp) }),
      },
    })
    // Log to history when completed or when episode is updated
    if (body.status === 'completed') {
      await db.watchHistory.create({
        data: {
          mediaType: 'series',
          tmdbId:    s.tmdbId,
          title:     s.title,
          poster:    s.poster ?? null,
          action:    'watched',
          rating:    s.rating ?? null,
        },
      }).catch(() => {})
    } else if (body.currentEp !== undefined) {
      await db.watchHistory.create({
        data: {
          mediaType: 'series',
          tmdbId:    s.tmdbId,
          title:     s.title,
          poster:    s.poster ?? null,
          action:    'watched',
          note:      s.currentSeason != null ? `S${s.currentSeason}E${s.currentEp}` : undefined,
        },
      }).catch(() => {})
    }
    return Response.json(s)
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!db) return Response.json({ error: 'DB unavailable' }, { status: 503 })
  try {
    await db.series.delete({ where: { id: parseInt(id) } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}
