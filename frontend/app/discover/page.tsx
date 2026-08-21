'use client'

import { useEffect, useState } from 'react'
import { IMG } from '@/lib/tmdb'

type TMDBItem = {
  id: number
  title?: string
  name?: string
  release_date?: string
  first_air_date?: string
  vote_average: number
  poster_path: string | null
  media_type?: string
  genre_ids?: number[]
}

const GENRE_TABS = ['All', 'Trending', 'Action', 'Drama', 'Sci-Fi', 'Comedy', 'Thriller']

export default function DiscoverPage() {
  const [active, setActive] = useState('All')
  const [movies, setMovies] = useState<TMDBItem[]>([])
  const [series, setSeries] = useState<TMDBItem[]>([])
  const [featured, setFeatured] = useState<TMDBItem | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/tmdb/trending')
      .then(r => r.json())
      .then(d => {
        const mv = (d.movies?.results ?? []) as TMDBItem[]
        const tv = (d.series?.results ?? []) as TMDBItem[]
        setMovies(mv)
        setSeries(tv)
        setFeatured(mv[0] ?? null)
      })
      .finally(() => setLoading(false))
  }, [])

  const title = (item: TMDBItem) => item.title ?? item.name ?? ''
  const year  = (item: TMDBItem) => (item.release_date ?? item.first_air_date ?? '').slice(0, 4)

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Discover</h1>
      </div>

      <div className="genre-tabs">
        {GENRE_TABS.map(g => (
          <button
            key={g}
            className={`filter-tab${active === g ? ' active' : ''}`}
            onClick={() => setActive(g)}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Hero */}
      {featured && (
        <div className="discover-hero">
          {featured.poster_path && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${IMG}${featured.poster_path}`} alt={title(featured)} className="hero-img" />
          )}
          <div className="hero-gradient" />
          <div className="hero-content">
            <div className="hero-badge">✦ Featured</div>
            <h2 className="hero-title">{title(featured)}</h2>
            <div className="hero-meta">
              {year(featured)} · ★ {featured.vote_average?.toFixed(1)}
            </div>
            <div className="hero-actions">
              <button className="btn btn-gold">+ Add to Library</button>
              <button className="btn btn-ghost">More Info</button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="movie-grid">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton skeleton-aspect" />
              <div className="skeleton skeleton-caption" />
            </div>
          ))}
        </div>
      )}

      {/* Trending Movies */}
      {movies.length > 0 && (
        <div className="section">
          <div className="section-row">
            <h2 className="section-title">Trending Movies</h2>
          </div>
          <div className="movie-grid">
            {movies.slice(0, 7).map(m => (
              <div key={m.id} className="movie-card">
                {m.poster_path
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={`${IMG}${m.poster_path}`} alt={title(m)} className="movie-poster" />
                  : <div className="movie-poster-placeholder">{title(m)[0]}</div>
                }
                <div className="movie-title">{title(m)}</div>
                <div className="movie-meta">{year(m)} <span className="rating-star">★{m.vote_average?.toFixed(1)}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trending Series */}
      {series.length > 0 && (
        <div className="section">
          <div className="section-row">
            <h2 className="section-title">Trending Series</h2>
          </div>
          <div className="movie-grid">
            {series.slice(0, 7).map(s => (
              <div key={s.id} className="movie-card">
                {s.poster_path
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={`${IMG}${s.poster_path}`} alt={title(s)} className="movie-poster" />
                  : <div className="movie-poster-placeholder">{title(s)[0]}</div>
                }
                <div className="movie-title">{title(s)}</div>
                <div className="movie-meta">{year(s)} <span className="rating-star">★{s.vote_average?.toFixed(1)}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
