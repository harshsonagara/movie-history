import { NextRequest } from 'next/server'
import { db } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json()
  if (!db) return Response.json({ error: 'DB unavailable' }, { status: 503 })
  try {
    const movie = await db.movie.update({
      where: { id: parseInt(id) },
      data: {
        ...(body.status   !== undefined && { status: body.status }),
        ...(body.rating   !== undefined && { rating: body.rating === null ? null : Number(body.rating) }),
        ...(body.progress !== undefined && { progress: Number(body.progress) }),
      },
    })
    return Response.json(movie)
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!db) return Response.json({ error: 'DB unavailable' }, { status: 503 })
  try {
    await db.movie.delete({ where: { id: parseInt(id) } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}
