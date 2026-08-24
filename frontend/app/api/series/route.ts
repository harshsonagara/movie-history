import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { addFallbackHistory, getFallbackSeries, upsertFallbackSeries } from '@/lib/fallback-store'
import { getCurrentUserId } from '@/lib/auth-user'

type SeriesMeta = {
  totalSeasons?: number | null
  totalEpisodes?: number | null
  perSeasonEpisodes?: { season: number; episodes: number }[]
  progress?: {
    currentSeason?: number | null
    currentEpisode?: number | null
    note?: string | null
  }
}

function numOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function parsePerSeasonEpisodes(v: unknown): { season: number; episodes: number }[] {
  if (!Array.isArray(v)) return []
  const items = v
    .map(x => ({ season: numOrNull((x as { season?: unknown }).season), episodes: numOrNull((x as { episodes?: unknown }).episodes) }))
    .filter(x => x.season != null && x.episodes != null)
    .map(x => ({ season: x.season as number, episodes: x.episodes as number }))
  return items.sort((a, b) => a.season - b.season)
}

function buildSeriesMeta(body: Record<string, unknown>): SeriesMeta {
  const totalSeasons = numOrNull(body.totalSeasons)
  const totalEpisodes = numOrNull(body.totalEpisodes ?? body.totalEps)
  const currentSeason = numOrNull(body.currentSeason)
  const currentEpisode = numOrNull(body.currentEp ?? body.currentEpisode)
  const currentNoteRaw = body.currentEpisodeNote
  const currentNote = typeof currentNoteRaw === 'string' && currentNoteRaw.trim() ? currentNoteRaw.trim() : null
  const perSeasonEpisodes = parsePerSeasonEpisodes(body.perSeasonEpisodes)

  return {
    totalSeasons,
    totalEpisodes,
    ...(perSeasonEpisodes.length ? { perSeasonEpisodes } : {}),
    progress: {
      currentSeason,
      currentEpisode,
      note: currentNote,
    },
  }
}

function extractCompat(meta: SeriesMeta | null | undefined) {
  const currentSeason = meta?.progress?.currentSeason ?? null
  const currentEp = meta?.progress?.currentEpisode ?? null
  const totalFromSeasons = meta?.perSeasonEpisodes?.reduce((sum, row) => sum + row.episodes, 0) ?? null
  const totalEps = meta?.totalEpisodes ?? totalFromSeasons
  return { currentSeason, currentEp, totalEps }
}

function toSeriesResponse(series: Record<string, unknown>) {
  const meta = (series.seriesMeta as SeriesMeta | null | undefined) ?? null
  return {
    ...series,
    ...extractCompat(meta),
  }
}

export async function GET() {
  const userId = await getCurrentUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!db) return Response.json(getFallbackSeries())
  try {
    const series = await db.series.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } })
    return Response.json(series.map(s => toSeriesResponse(s as unknown as Record<string, unknown>)))
  } catch {
    return Response.json([])
  }
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json() as Record<string, unknown>
  const meta = buildSeriesMeta(body)
  const compat = extractCompat(meta)
  if (!db) {
    const s = upsertFallbackSeries({
      tmdbId: Number(body.tmdbId),
      title: String(body.title ?? ''),
      poster: (body.poster as string | null | undefined) ?? null,
      year: numOrNull(body.year),
      genre: (body.genre as string | null | undefined) ?? null,
      rating: numOrNull(body.rating),
      overview: (body.overview as string | null | undefined) ?? null,
      status: (body.status as string | undefined) ?? 'watching',
      seriesMeta: meta,
      currentSeason: compat.currentSeason,
      currentEp: compat.currentEp,
      totalEps: compat.totalEps,
    })
    const note = s.seriesMeta?.progress?.note
      ?? (s.currentSeason != null && s.currentEp != null ? `S${s.currentSeason}E${s.currentEp}` : null)
    addFallbackHistory({
      mediaType: 'series',
      tmdbId: s.tmdbId,
      title: s.title,
      poster: s.poster ?? null,
      action: s.status === 'watchlist' ? 'added' : s.status === 'completed' ? 'watched' : 'started',
      rating: s.rating ?? null,
      note,
    })
    return Response.json(toSeriesResponse(s as unknown as Record<string, unknown>), { status: 201 })
  }
  try {
    const s = await db.series.upsert({
      where: { userId_tmdbId: { userId, tmdbId: Number(body.tmdbId) } },
      update: {
        status: (body.status as string | undefined) ?? 'watching',
        rating: numOrNull(body.rating),
        genre: (body.genre as string | null | undefined) ?? undefined,
        overview: (body.overview as string | null | undefined) ?? undefined,
        seriesMeta: meta,
      },
      create: {
        tmdbId: Number(body.tmdbId),
        userId,
        title: String(body.title ?? ''),
        poster: (body.poster as string | null | undefined) ?? null,
        year: numOrNull(body.year),
        genre: (body.genre as string | null | undefined) ?? null,
        rating: numOrNull(body.rating),
        overview: (body.overview as string | null | undefined) ?? null,
        status: (body.status as string | undefined) ?? 'watching',
        seriesMeta: meta,
      },
    })
    // Log to history
    const action = s.status === 'watchlist' ? 'added' : s.status === 'completed' ? 'watched' : 'started'
    await db.watchHistory.create({
      data: {
        mediaType: 'series',
        userId,
        tmdbId: s.tmdbId,
        title: s.title,
        poster: s.poster ?? null,
        action,
        note: meta.progress?.note ?? undefined,
      },
    }).catch(() => { })
    return Response.json(toSeriesResponse(s as unknown as Record<string, unknown>), { status: 201 })
  } catch {
    return Response.json({ error: 'DB unavailable' }, { status: 503 })
  }
}
