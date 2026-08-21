import { searchTMDB } from '@/lib/tmdb'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return Response.json({ results: [] })
  try {
    const data = await searchTMDB(q)
    return Response.json(data)
  } catch (err: any) {
    return Response.json({ error: err.message, results: [] }, { status: 503 })
  }
}
