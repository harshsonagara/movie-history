'use client'

import { useState, useCallback } from 'react'
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

export default function AddPage() {
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState<Result[]>([])
  const [selected, setSelected] = useState<Result | null>(null)
  const [loading, setLoading]   = useState(false)
  const [status, setStatus]     = useState('watched')
  const [rating, setRating]     = useState('')
  const [saved, setSaved]       = useState(false)

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

  const title = (r: Result) => r.title ?? r.name ?? ''
  const year  = (r: Result) => (r.release_date ?? r.first_air_date ?? '').slice(0, 4)

  const handleSave = async () => {
    if (!selected) return
    const endpoint = selected.media_type === 'tv' ? '/api/series' : '/api/movies'
    await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tmdbId: selected.id,
        title: title(selected),
        poster: selected.poster_path ?? null,
        year: year(selected) ? parseInt(year(selected)) : null,
        rating: rating ? parseFloat(rating) : null,
        status,
      }),
    })
    setSaved(true)
    setTimeout(() => { setSaved(false); setSelected(null); setQuery(''); setResults([]) }, 2000)
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Add Content</h1>
        <p className="page-sub">Search and add movies or series to your library</p>
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
              onChange={e => { setQuery(e.target.value); search(e.target.value) }}
              autoFocus
            />
          </div>

          {!query && (
            <div className="empty-state">
              <div className="empty-icon">🎬</div>
              <div className="empty-text">Start typing to search</div>
            </div>
          )}

          {loading && (
            <div className="skeleton-list">
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

          <div className="results-list">
            {results.map(r => (
              <div
                key={r.id}
                className={`add-result${selected?.id === r.id ? ' selected' : ''}`}
                onClick={() => setSelected(r)}
              >
                {r.poster_path
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={`${IMG}${r.poster_path}`} alt={title(r)} className="add-result-thumb" />
                  : <div className="add-result-thumb">{title(r)[0]}</div>
                }
                <div className="result-content">
                  <div className="result-title">{title(r)}</div>
                  <div className="result-meta">
                    {r.media_type === 'tv' ? 'Series' : 'Movie'} · {year(r)}
                    {r.vote_average ? ` · ★${r.vote_average.toFixed(1)}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: detail / form */}
        <div>
          {!selected ? (
            <div className="card add-empty-card">
              <ArrowLeft size={24} className="opacity-40" />
              <div className="result-meta">Select a title from the results</div>
            </div>
          ) : saved ? (
            <div className="card add-empty-card">
              <div className="empty-icon">✅</div>
              <div className="watchlist-title">Added to library!</div>
            </div>
          ) : (
            <div className="card">
              <div className="add-detail-header">
                {selected.poster_path
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={`${IMG}${selected.poster_path}`} alt={title(selected)} className="add-detail-poster" />
                  : <div className="add-detail-poster-ph">{title(selected)[0]}</div>
                }
                <div className="add-detail-info">
                  <div className="add-detail-title">{title(selected)}</div>
                  <div className="add-detail-meta">
                    {selected.media_type === 'tv' ? 'Series' : 'Movie'} · {year(selected)}
                    {selected.vote_average ? ` · ★${selected.vote_average.toFixed(1)}` : ''}
                  </div>
                  {selected.overview && (
                    <div className="add-detail-overview">{selected.overview}</div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)}>
                  <option value="watched">Watched</option>
                  <option value="watching">Currently Watching</option>
                  <option value="watchlist">Add to Watchlist</option>
                </select>
              </div>

              <div className="form-group">
                <label>Your Rating (optional)</label>
                <input
                  className="search-input"
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  placeholder="1–10"
                  value={rating}
                  onChange={e => setRating(e.target.value)}
                />
              </div>

              <button className="btn btn-gold w-full justify-center" onClick={handleSave}>
                Add to Library
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
