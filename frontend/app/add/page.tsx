'use client'

import { useState, useCallback, useEffect } from 'react'
import { Search, ArrowLeft } from 'lucide-react'
import { IMG } from '@/lib/tmdb'

type Result = {
  id: number
  title?: string
  name?: string
  media_type: string
  release_date?: string
  first_air_date?: string
  vote_average?: number
  poster_path?: string | null
  overview?: string
}

type SeriesDetails = {
  overview?: string | null
  genres?: string[]
  totalSeasons?: number | null
  totalEpisodes?: number | null
  perSeasonEpisodes?: { season: number; episodes: number }[]
}

const MOVIE_STATUSES = [
  { value: 'watched', label: 'Watched' },
  { value: 'watching', label: 'Currently Watching' },
  { value: 'watchlist', label: 'Add to Watchlist' },
]

const SERIES_STATUSES = [
  { value: 'watching', label: 'Currently Watching' },
  { value: 'completed', label: 'Completed' },
  { value: 'watchlist', label: 'Add to Watchlist' },
]

export default function AddPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [selected, setSelected] = useState<Result | null>(null)
  const [manualMode, setManualMode] = useState(false)
  const [manualType, setManualType] = useState<'movie' | 'series'>('movie')
  const [manualTitle, setManualTitle] = useState('')
  const [manualYear, setManualYear] = useState('')
  const [manualGenre, setManualGenre] = useState('')
  const [manualOverview, setManualOverview] = useState('')
  const [manualRuntime, setManualRuntime] = useState('')
  const [manualDirector, setManualDirector] = useState('')
  const [manualPoster, setManualPoster] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('watched')
  const [rating, setRating] = useState('')
  const [totalSeasons, setTotalSeasons] = useState('')
  const [perSeasonEpisodesText, setPerSeasonEpisodesText] = useState('')
  const [season, setSeason] = useState('')
  const [episode, setEpisode] = useState('')
  const [currentEpisodeNote, setCurrentEpisodeNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedTitle, setSavedTitle] = useState('')
  const [saveError, setSaveError] = useState('')
  const [seriesDetails, setSeriesDetails] = useState<SeriesDetails | null>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [existingTmdbIds, setExistingTmdbIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    Promise.all([
      fetch('/api/movies').then(r => r.json()).catch(() => []),
      fetch('/api/series').then(r => r.json()).catch(() => []),
    ]).then(([movies, series]) => {
      const ids = new Set<number>()
      if (Array.isArray(movies)) movies.forEach((m: { tmdbId: number }) => ids.add(m.tmdbId))
      if (Array.isArray(series)) series.forEach((s: { tmdbId: number }) => ids.add(s.tmdbId))
      setExistingTmdbIds(ids)
    })
  }, [])

  const selectedIsSeries = selected?.media_type === 'tv'
  const isSeries = manualMode ? manualType === 'series' : selectedIsSeries
  const statuses = isSeries ? SERIES_STATUSES : MOVIE_STATUSES

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      setResults((data.results ?? []).filter((r: Result) => r.media_type !== 'person'))
    } finally {
      setLoading(false)
    }
  }, [])

  const getTitle = (r: Result) => r.title ?? r.name ?? ''
  const getYear = (r: Result) => (r.release_date ?? r.first_air_date ?? '').slice(0, 4)

  const toPerSeasonText = (rows: { season: number; episodes: number }[]) => {
    return rows.map(row => `S${row.season}:${row.episodes}`).join(', ')
  }

  const loadSeriesDetails = useCallback(async (id: number) => {
    setDetailsLoading(true)
    setSeriesDetails(null)
    try {
      const res = await fetch(`/api/tmdb/series/${id}`)
      if (!res.ok) return
      const data = await res.json() as SeriesDetails
      setSeriesDetails(data)

      if (data.totalSeasons != null) setTotalSeasons(String(data.totalSeasons))
      if (Array.isArray(data.perSeasonEpisodes) && data.perSeasonEpisodes.length) {
        setPerSeasonEpisodesText(toPerSeasonText(data.perSeasonEpisodes))
      }
    } catch {
      setSeriesDetails(null)
    } finally {
      setDetailsLoading(false)
    }
  }, [])

  const parsePerSeasonEpisodes = (text: string) => {
    const chunks = text.split(',').map(s => s.trim()).filter(Boolean)
    const rows: { season: number; episodes: number }[] = []
    for (const chunk of chunks) {
      const normalized = chunk.toLowerCase().replace(/^s/, '')
      const parts = normalized.split(':').map(x => x.trim())
      if (parts.length !== 2) continue
      const s = Number(parts[0])
      const e = Number(parts[1])
      if (Number.isFinite(s) && s > 0 && Number.isFinite(e) && e > 0) {
        rows.push({ season: s, episodes: e })
      }
    }
    return rows.sort((a, b) => a.season - b.season)
  }

  const handleSave = async () => {
    if (saving) return
    if (!manualMode && !selected) return
    if (manualMode && !manualTitle.trim()) {
      setSaveError('Please enter a title for manual add.')
      return
    }

    setSaving(true)
    setSaveError('')
    const endpoint = isSeries ? '/api/series' : '/api/movies'
    try {
      const perSeasonEpisodes = isSeries ? parsePerSeasonEpisodes(perSeasonEpisodesText) : []
      const totalEpisodes = perSeasonEpisodes.reduce((sum, row) => sum + row.episodes, 0)

      const payload = manualMode
        ? {
          tmdbId: -Date.now(),
          title: manualTitle.trim(),
          poster: manualPoster.trim() || null,
          year: manualYear ? parseInt(manualYear) : null,
          genre: manualGenre.trim() || null,
          overview: manualOverview.trim() || null,
          runtime: !isSeries && manualRuntime ? parseInt(manualRuntime) : null,
          director: !isSeries ? manualDirector.trim() || null : null,
          rating: rating ? parseFloat(rating) : null,
          status,
          totalSeasons: isSeries && totalSeasons ? parseInt(totalSeasons) : null,
          perSeasonEpisodes,
          totalEpisodes: isSeries ? (totalEpisodes || null) : null,
          currentSeason: isSeries && status === 'watching' && season ? parseInt(season) : null,
          currentEp: isSeries && status === 'watching' && episode ? parseInt(episode) : null,
          currentEpisodeNote: isSeries && status === 'watching' ? currentEpisodeNote.trim() || null : null,
        }
        : {
          tmdbId: selected!.id,
          title: getTitle(selected!),
          poster: selected!.poster_path ?? null,
          year: getYear(selected!) ? parseInt(getYear(selected!)) : null,
          overview: seriesDetails?.overview ?? selected!.overview ?? null,
          genre: isSeries ? (seriesDetails?.genres?.join(', ') ?? null) : null,
          rating: rating ? parseFloat(rating) : null,
          status,
          totalSeasons: isSeries && totalSeasons ? parseInt(totalSeasons) : null,
          perSeasonEpisodes,
          totalEpisodes: isSeries ? (totalEpisodes || null) : null,
          currentSeason: isSeries && status === 'watching' && season ? parseInt(season) : null,
          currentEp: isSeries && status === 'watching' && episode ? parseInt(episode) : null,
          currentEpisodeNote: isSeries && status === 'watching' ? currentEpisodeNote.trim() || null : null,
        }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(data.error ?? 'Could not save title')
      }

      setSavedTitle(manualMode ? manualTitle.trim() : getTitle(selected!))
      setSaved(true)
      setRating('')
      setTotalSeasons('')
      setPerSeasonEpisodesText('')
      setSeason('')
      setEpisode('')
      setCurrentEpisodeNote('')
      setManualTitle('')
      setManualYear('')
      setManualGenre('')
      setManualOverview('')
      setManualRuntime('')
      setManualDirector('')
      setManualPoster('')
      setTimeout(() => {
        setSaved(false)
        setSelected(null)
        setQuery('')
        setResults([])
        setManualMode(false)
      }, 2500)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not save title'
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Add Content</h1>
        <p className="page-sub">Search movies or series and add them to your library</p>
      </div>

      <div className="add-layout">
        {/* Left: search */}
        <div>
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              className="search-input"
              placeholder="Search for a movie or series…"
              value={query}
              onChange={e => {
                setManualMode(false)
                setQuery(e.target.value)
                search(e.target.value)
              }}
              autoFocus
            />
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setManualMode(true)
                setSelected(null)
                setStatus(manualType === 'series' ? 'watching' : 'watched')
                setSaveError('')
              }}
            >
              + Add Manually
            </button>
            {manualMode && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setManualMode(false)
                  setSaveError('')
                }}
              >
                Back to Search
              </button>
            )}
          </div>

          {!manualMode && !query && !results.length && (
            <div className="empty-state">
              <div className="empty-icon">🎬</div>
              <div className="empty-text">Start typing to search</div>
              <div className="empty-sub">Movies and series from TMDB</div>
            </div>
          )}

          {loading && (
            <div className="skeleton-list mt-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="add-skeleton-row">
                  <div className="skeleton skeleton-thumb-sm" />
                  <div className="skeleton-lines">
                    <div className="skeleton skeleton-line-lg" />
                    <div className="skeleton skeleton-line-sm" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!manualMode && query && !loading && results.length === 0 && (
            <div className="empty-state">
              <div className="empty-text">No results found</div>
              <div className="empty-sub">Use Add Manually to add this title with your own details.</div>
            </div>
          )}

          {!manualMode && (
            <div className="results-list">
              {results.map(r => (
                <div
                  key={r.id}
                  className={`add-result${selected?.id === r.id ? ' selected' : ''}`}
                  onClick={() => {
                    setSelected(r)
                    setStatus(r.media_type === 'tv' ? 'watching' : 'watched')
                    setSeriesDetails(null)
                    setTotalSeasons('')
                    setPerSeasonEpisodesText('')
                    setSeason('')
                    setEpisode('')
                    setCurrentEpisodeNote('')
                    if (r.media_type === 'tv') {
                      loadSeriesDetails(r.id)
                    }
                  }}
                >
                  {r.poster_path
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={`${IMG}${r.poster_path}`} alt={getTitle(r)} className="add-result-thumb" />
                    : <div className="add-result-thumb">{getTitle(r)[0] ?? '?'}</div>
                  }
                  <div className="result-content">
                    <div className="result-title">
                      {getTitle(r)}
                      {existingTmdbIds.has(r.id) && <span className="in-library-badge">In library</span>}
                    </div>
                    <div className="result-meta">
                      <span className={`media-badge media-badge-${r.media_type === 'tv' ? 'series' : 'movie'}`}>
                        {r.media_type === 'tv' ? 'Series' : 'Movie'}
                      </span>
                      {' '}{getYear(r)}
                      {r.vote_average ? ` · ★${r.vote_average.toFixed(1)}` : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: detail / save form */}
        <div>
          {!manualMode && !selected ? (
            <div className="card add-empty-card">
              <ArrowLeft size={24} className="opacity-40" />
              <div className="result-meta">Select a title from the results</div>
            </div>
          ) : saved ? (
            <div className="card add-empty-card">
              <div className="empty-icon">✅</div>
              <div className="watchlist-title">Added to library!</div>
              <div className="empty-sub">{savedTitle || 'Title'} saved</div>
            </div>
          ) : (
            <div className="card">
              {!manualMode && selected && (
                <div className="add-detail-header">
                  {selected.poster_path
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={`${IMG}${selected.poster_path}`} alt={getTitle(selected)} className="add-detail-poster" />
                    : <div className="add-detail-poster-ph">{getTitle(selected)[0] ?? '?'}</div>
                  }
                  <div className="add-detail-info">
                    <div className="add-detail-title">{getTitle(selected)}</div>
                    <div className="add-detail-meta">
                      <span className={`media-badge media-badge-${isSeries ? 'series' : 'movie'}`}>
                        {isSeries ? 'Series' : 'Movie'}
                      </span>
                      {' '}{getYear(selected)}
                      {selected.vote_average ? ` · ★${selected.vote_average.toFixed(1)}` : ''}
                    </div>
                    {selected.overview && (
                      <div className="add-detail-overview">{seriesDetails?.overview ?? selected.overview}</div>
                    )}
                    {isSeries && (
                      <div className="add-detail-overview">
                        {detailsLoading
                          ? 'Loading full season details from TMDB…'
                          : seriesDetails?.totalSeasons != null
                            ? `${seriesDetails.totalSeasons} seasons${seriesDetails.totalEpisodes != null ? ` · ${seriesDetails.totalEpisodes} episodes` : ''}`
                            : ''}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {manualMode && (
                <div className="section-row" style={{ marginBottom: 12 }}>
                  <h3 className="section-title-sm">Manual Entry</h3>
                  <span className="result-meta">Add your own details</span>
                </div>
              )}

              {manualMode && (
                <>
                  <div className="modal-two-col">
                    <div className="form-group">
                      <label>Type</label>
                      <select
                        value={manualType}
                        onChange={e => {
                          const next = e.target.value as 'movie' | 'series'
                          setManualType(next)
                          setStatus(next === 'series' ? 'watching' : 'watched')
                        }}
                      >
                        <option value="movie">Movie</option>
                        <option value="series">Series</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        className="form-input"
                        value={manualTitle}
                        onChange={e => setManualTitle(e.target.value)}
                        placeholder="Enter title"
                      />
                    </div>
                  </div>

                  <div className="modal-two-col">
                    <div className="form-group">
                      <label>Year</label>
                      <input
                        className="form-input"
                        type="number"
                        min="1900"
                        max="2100"
                        value={manualYear}
                        onChange={e => setManualYear(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                    <div className="form-group">
                      <label>Genre</label>
                      <input
                        className="form-input"
                        value={manualGenre}
                        onChange={e => setManualGenre(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {!isSeries && (
                    <div className="modal-two-col">
                      <div className="form-group">
                        <label>Runtime (minutes)</label>
                        <input
                          className="form-input"
                          type="number"
                          min="1"
                          value={manualRuntime}
                          onChange={e => setManualRuntime(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                      <div className="form-group">
                        <label>Director</label>
                        <input
                          className="form-input"
                          value={manualDirector}
                          onChange={e => setManualDirector(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label>Poster Path (optional TMDB path, e.g. /abc.jpg)</label>
                    <input
                      className="form-input"
                      value={manualPoster}
                      onChange={e => setManualPoster(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      rows={4}
                      value={manualOverview}
                      onChange={e => setManualOverview(e.target.value)}
                      placeholder="Add story, notes, or season breakdown details"
                    />
                  </div>
                </>
              )}

              {!manualMode && selected && existingTmdbIds.has(selected.id) && (
                <div className="form-note">Already in your library — saving will update it.</div>
              )}

              <div className="form-group">
                <label>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  {statuses.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Your Rating (1–10, optional)</label>
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  placeholder="Leave blank to skip"
                  value={rating}
                  onChange={e => setRating(e.target.value)}
                />
              </div>

              {isSeries && (
                <>
                  <div className="form-group">
                    <label>Total Seasons</label>
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      placeholder="e.g. 8"
                      value={totalSeasons}
                      onChange={e => setTotalSeasons(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Per-Season Episodes (optional)</label>
                    <textarea
                      rows={2}
                      value={perSeasonEpisodesText}
                      onChange={e => setPerSeasonEpisodesText(e.target.value)}
                      placeholder="Format: S1:8, S2:10, S3:12 (auto-filled from TMDB when available)"
                    />
                  </div>
                </>
              )}

              {isSeries && status === 'watching' && (
                <>
                  <div className="modal-three-col">
                    <div className="form-group">
                      <label>Current Season</label>
                      <input
                        className="form-input"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={season}
                        onChange={e => setSeason(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Current Episode</label>
                      <input
                        className="form-input"
                        type="number"
                        min="1"
                        placeholder="1"
                        value={episode}
                        onChange={e => setEpisode(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label>Current Episode Note (optional)</label>
                      <input
                        className="form-input"
                        placeholder="Short description"
                        value={currentEpisodeNote}
                        onChange={e => setCurrentEpisodeNote(e.target.value)}
                      />
                    </div>
                  </div>
                </>
              )}

              <button
                className="btn btn-gold w-full justify-center"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Saving…' : `Add ${isSeries ? 'Series' : 'Movie'} to Library`}
              </button>
              {saveError && <div className="form-error">{saveError}</div>}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
