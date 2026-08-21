'use client'

import { useState, useCallback } from 'react'
import { Search } from 'lucide-react'
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

export default function SearchPage() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)

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

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Search</h1>
        <p className="page-sub">Find movies, shows, and more</p>
      </div>

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

      {loading && (
        <div className="skeleton-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton-row">
              <div className="skeleton skeleton-thumb-sm" />
              <div className="skeleton-lines">
                <div className="skeleton skeleton-line-lg" />
                <div className="skeleton skeleton-line-sm" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-text">No results for &ldquo;{query}&rdquo;</div>
        </div>
      )}

      {!loading && !query && (
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <div className="empty-text">Start typing to search</div>
          <div className="empty-sub">Movies, TV shows, and more</div>
        </div>
      )}

      <div className="results-list">
        {results.map(r => (
          <div key={r.id} className="add-result">
            {r.poster_path
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={`${IMG}${r.poster_path}`} alt={title(r)} className="add-result-thumb" />
              : <div className="add-result-thumb">{title(r)[0]}</div>
            }
            <div className="result-content">
              <div className="result-title">{title(r)}</div>
              <div className="result-meta">
                {r.media_type === 'tv' ? '📺 Series' : '🎬 Movie'} · {year(r)}
                {r.vote_average ? ` · ★${r.vote_average.toFixed(1)}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
