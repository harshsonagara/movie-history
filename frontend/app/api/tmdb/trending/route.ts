import { getTrending } from '@/lib/tmdb'
import { NextRequest } from 'next/server'

export async function GET(_req: NextRequest) {
  try {
    const [movies, series] = await Promise.all([
      getTrending('movie', 'week'),
      getTrending('tv', 'week'),
    ])
    return Response.json({ movies, series })
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 503 })
  }
}
