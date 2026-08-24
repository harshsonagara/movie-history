import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { addFallbackHistory, deleteFallbackSeries, updateFallbackSeries } from '@/lib/fallback-store'
import { getCurrentUserId } from '@/lib/auth-user'
import { asInt, asNullableNumber, asTrimmedString, limitRequest, parseJsonObjectBody, validateStatus } from '@/lib/api-guard'

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

function parsePerSeasonEpisodes(v: unknown): { season: number; episodes: number }[] | undefined {
  if (!Array.isArray(v)) return undefined
  const rows = v
    .map(x => ({ season: numOrNull((x as { season?: unknown }).season), episodes: numOrNull((x as { episodes?: unknown }).episodes) }))
    .filter(x => x.season != null && x.episodes != null)
    .map(x => ({ season: x.season as number, episodes: x.episodes as number }))
    .sort((a, b) => a.season - b.season)
  return rows
}

function mergeSeriesMeta(existing: SeriesMeta | null | undefined, body: Record<string, unknown>): SeriesMeta {
  const next: SeriesMeta = { ...(existing ?? {}) }

  if (body.totalSeasons !== undefined) next.totalSeasons = numOrNull(body.totalSeasons)
  if (body.totalEpisodes !== undefined || body.totalEps !== undefined) {
    next.totalEpisodes = numOrNull(body.totalEpisodes ?? body.totalEps)
  }

  const perSeasonEpisodes = parsePerSeasonEpisodes(body.perSeasonEpisodes)
  if (perSeasonEpisodes !== undefined) {
    if (perSeasonEpisodes.length) next.perSeasonEpisodes = perSeasonEpisodes
    else delete next.perSeasonEpisodes
  }

  const hasProgressPatch =
    body.currentSeason !== undefined ||
    body.currentEp !== undefined ||
    body.currentEpisode !== undefined ||
    body.currentEpisodeNote !== undefined

  if (hasProgressPatch) {
    next.progress = { ...(existing?.progress ?? {}) }
    if (body.currentSeason !== undefined) next.progress.currentSeason = numOrNull(body.currentSeason)
    if (body.currentEp !== undefined || body.currentEpisode !== undefined) {
      next.progress.currentEpisode = numOrNull(body.currentEp ?? body.currentEpisode)
    }
    if (body.currentEpisodeNote !== undefined) {
      const note = body.currentEpisodeNote
      next.progress.note = typeof note === 'string' && note.trim() ? note.trim() : null
    }
  }

  return next
}

function extractCompat(meta: SeriesMeta | null | undefined) {
  const currentSeason = meta?.progress?.currentSeason ?? null
  const currentEp = meta?.progress?.currentEpisode ?? null
  const totalFromSeasons = meta?.perSeasonEpisodes?.reduce((sum, row) => sum + row.episodes, 0) ?? null
  const totalEps = meta?.totalEpisodes ?? totalFromSeasons
  return { currentSeason, currentEp, totalEps }
}

function toSeriesResponse<T extends { seriesMeta?: unknown }>(series: T) {
  const meta = (series.seriesMeta as SeriesMeta | null | undefined) ?? null
  return {
    ...series,
    ...extractCompat(meta),
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = limitRequest(req, 'series-patch', { windowMs: 60_000, max: 80 })
  if (rateLimited) return rateLimited

  const userId = await getCurrentUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const seriesId = asInt(id)
  if (!seriesId || seriesId <= 0) return Response.json({ error: 'Invalid id' }, { status: 400 })

  const parsed = await parseJsonObjectBody(req)
  if (!parsed.ok) return parsed.response
  const body = parsed.body

  let status: string | undefined
  if (body.status !== undefined) {
    const nextStatus = validateStatus(body.status, ['watching', 'watchlist', 'completed'])
    if (!nextStatus) {
      return Response.json({ error: 'Invalid status' }, { status: 400 })
    }
    status = nextStatus
  }
  const rating = asNullableNumber(body.rating)
  if (rating !== undefined && rating !== null && (rating < 0 || rating > 10)) {
    return Response.json({ error: 'rating must be between 0 and 10' }, { status: 400 })
  }
  const nextOverview = body.overview === undefined ? undefined : body.overview === null ? null : asTrimmedString(body.overview)
  const notes = body.notes === undefined ? undefined : body.notes === null ? null : asTrimmedString(body.notes)

  if (!db) {
    const nextMeta = mergeSeriesMeta(undefined, body)
    const compat = extractCompat(nextMeta)
    const s = updateFallbackSeries(seriesId, {
      status,
      rating,
      notes,
      seriesMeta: nextMeta,
      currentSeason: compat.currentSeason,
      currentEp: compat.currentEp,
      totalEps: compat.totalEps,
    })
    if (!s) return Response.json({ error: 'Not found' }, { status: 404 })

    if (body.status === 'completed') {
      addFallbackHistory({
        mediaType: 'series',
        tmdbId: s.tmdbId,
        title: s.title,
        poster: s.poster ?? null,
        action: 'watched',
        rating: s.rating ?? null,
        note: null,
      })
    } else if (body.currentEp !== undefined) {
      addFallbackHistory({
        mediaType: 'series',
        tmdbId: s.tmdbId,
        title: s.title,
        poster: s.poster ?? null,
        action: 'watched',
        rating: s.rating ?? null,
        note: s.seriesMeta?.progress?.note ?? (s.currentSeason != null ? `S${s.currentSeason}E${s.currentEp}` : null),
      })
    }
    return Response.json(toSeriesResponse(s))
  }
  try {
    const existing = await db.series.findFirst({ where: { id: seriesId, userId } })
    if (!existing) return Response.json({ error: 'Not found' }, { status: 404 })

    const currentMeta = (existing.seriesMeta as SeriesMeta | null | undefined) ?? null
    const nextMeta = mergeSeriesMeta(currentMeta, body)
    const nextStatus = status

    const s = await db.series.update({
      where: { id: seriesId },
      data: {
        ...(nextStatus !== undefined && { status: nextStatus }),
        ...(rating !== undefined && { rating }),
        ...(nextOverview !== undefined && { overview: nextOverview }),
        ...(notes !== undefined && { notes }),
        seriesMeta: nextMeta,
      },
    })
    // Log to history when completed or when episode is updated
    if (body.status === 'completed') {
      await db.watchHistory.create({
        data: {
          mediaType: 'series',
          userId,
          tmdbId: s.tmdbId,
          title: s.title,
          poster: s.poster ?? null,
          action: 'watched',
          rating: s.rating ?? null,
        },
      }).catch(() => { })
    } else if (body.currentEp !== undefined) {
      await db.watchHistory.create({
        data: {
          mediaType: 'series',
          userId,
          tmdbId: s.tmdbId,
          title: s.title,
          poster: s.poster ?? null,
          action: 'watched',
          note: nextMeta.progress?.note ?? (nextMeta.progress?.currentSeason != null ? `S${nextMeta.progress.currentSeason}E${nextMeta.progress.currentEpisode ?? '?'}` : undefined),
        },
      }).catch(() => { })
    }
    return Response.json(toSeriesResponse(s))
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimited = limitRequest(_req, 'series-delete', { windowMs: 60_000, max: 40 })
  if (rateLimited) return rateLimited

  const userId = await getCurrentUserId()
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const seriesId = asInt(id)
  if (!seriesId || seriesId <= 0) return Response.json({ error: 'Invalid id' }, { status: 400 })

  if (!db) {
    const ok = deleteFallbackSeries(seriesId)
    if (!ok) return Response.json({ error: 'Not found' }, { status: 404 })
    return new Response(null, { status: 204 })
  }
  try {
    const result = await db.series.deleteMany({ where: { id: seriesId, userId } })
    if (result.count === 0) return Response.json({ error: 'Not found' }, { status: 404 })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }
}
