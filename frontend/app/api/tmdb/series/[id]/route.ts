import { NextRequest } from 'next/server'
import { getTVDetails, getTVSeasonDetails } from '@/lib/tmdb'

type TVSeason = {
    season_number?: number
    episode_count?: number
    name?: string
    air_date?: string
    poster_path?: string | null
    overview?: string
}

type TVDetails = {
    id: number
    name?: string
    first_air_date?: string
    overview?: string
    number_of_seasons?: number
    number_of_episodes?: number
    genres?: { id: number; name: string }[]
    seasons?: TVSeason[]
}

function asId(value: string): number | null {
    const n = Number(value)
    if (!Number.isInteger(n) || n <= 0) return null
    return n
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const tvId = asId(id)
    if (!tvId) return Response.json({ error: 'Invalid series id' }, { status: 400 })

    const includeEpisodes = req.nextUrl.searchParams.get('includeEpisodes') === '1'

    try {
        const data = (await getTVDetails(tvId)) as TVDetails
        const seasons = (data.seasons ?? []).filter(s => {
            const seasonNumber = Number(s.season_number ?? -1)
            return Number.isFinite(seasonNumber) && seasonNumber >= 0
        })

        const perSeasonEpisodes = seasons
            .map(s => ({
                season: Number(s.season_number ?? 0),
                episodes: Number(s.episode_count ?? 0),
            }))
            .filter(x => x.season >= 0 && x.episodes > 0)
            .sort((a, b) => a.season - b.season)

        const response: Record<string, unknown> = {
            id: data.id,
            name: data.name ?? null,
            firstAirDate: data.first_air_date ?? null,
            overview: data.overview ?? null,
            genres: (data.genres ?? []).map(g => g.name),
            totalSeasons: data.number_of_seasons ?? null,
            totalEpisodes: data.number_of_episodes ?? perSeasonEpisodes.reduce((sum, row) => sum + row.episodes, 0),
            perSeasonEpisodes,
            seasons: seasons.map(s => ({
                season: s.season_number ?? null,
                name: s.name ?? null,
                airDate: s.air_date ?? null,
                episodeCount: s.episode_count ?? null,
                poster: s.poster_path ?? null,
                overview: s.overview ?? null,
            })),
        }

        if (includeEpisodes) {
            const seasonDetails = await Promise.all(
                perSeasonEpisodes.map(async row => {
                    const details = await getTVSeasonDetails(tvId, row.season)
                    return {
                        season: row.season,
                        episodes: Array.isArray(details.episodes)
                            ? details.episodes.map((ep: Record<string, unknown>) => ({
                                episodeNumber: Number(ep.episode_number ?? 0),
                                name: typeof ep.name === 'string' ? ep.name : null,
                                airDate: typeof ep.air_date === 'string' ? ep.air_date : null,
                                runtime: Number(ep.runtime ?? 0) || null,
                                overview: typeof ep.overview === 'string' ? ep.overview : null,
                            }))
                            : [],
                    }
                }),
            )
            response.seasonEpisodes = seasonDetails
        }

        return Response.json(response)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'TMDB request failed'
        return Response.json({ error: message }, { status: 503 })
    }
}
