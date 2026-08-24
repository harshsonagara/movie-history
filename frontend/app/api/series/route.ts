import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { addFallbackHistory, getFallbackSeries, upsertFallbackSeries } from '@/lib/fallback-store'
import { getCurrentUserId } from '@/lib/auth-user'
import { asNullableNumber, asNumber, asTrimmedString, limitRequest, parseJsonObjectBody, validateStatus } from '@/lib/api-guard'

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
  const rateLimited = limitRequest(req, 'series-post', { windowMs: 60_000, max: 40 })
  if (rateLimited) return rateLimited

  const userId = await getCurrentUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = await parseJsonObjectBody(req)
  if (!parsed.ok) return parsed.response
  const body = parsed.body

  const tmdbId = asNumber(body.tmdbId)
  const title = asTrimmedString(body.title)
  if (!tmdbId || tmdbId <= 0 || !title) {
    return Response.json({ error: 'tmdbId and title are required' }, { status: 400 })
  }

  const rating = asNullableNumber(body.rating)
  if (rating !== undefined && rating !== null && (rating < 0 || rating > 10)) {
    return Response.json({ error: 'rating must be between 0 and 10' }, { status: 400 })
  }

  const status = validateStatus(body.status, ['watching', 'watchlist', 'completed']) ?? 'watching'
  const poster = body.poster === null ? null : asTrimmedString(body.poster)
  const genre = body.genre === null ? null : asTrimmedString(body.genre)
  const overview = body.overview === null ? null : asTrimmedString(body.overview)
  const year = asNullableNumber(body.year)

  const meta = buildSeriesMeta(body)
  const compat = extractCompat(meta)
  if (!db) {
    const s = upsertFallbackSeries({
      tmdbId,
      title,
      poster: poster ?? null,
      year: year ?? null,
      genre: genre ?? null,
      rating: rating ?? null,
      overview: overview ?? null,
      status,
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
      where: { userId_tmdbId: { userId, tmdbId } },
      update: {
        status,
        rating: rating ?? null,
        genre: genre ?? undefined,
        overview: overview ?? undefined,
        seriesMeta: meta,
      },
      create: {
        tmdbId,
        userId,
        title,
        poster: poster ?? null,
        year: year ?? null,
        genre: genre ?? null,
        rating: rating ?? null,
        overview: overview ?? null,
        status,
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
