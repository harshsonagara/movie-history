'use client'

import { useState, useEffect } from 'react'
import { MOCK_MOVIES } from '@/lib/mock-data'
import Link from 'next/link'
import { Poster } from '@/components/Poster'

const TABS = ['All Movies', 'Watching', 'Completed', 'Watchlist']
const STATUS_MAP: Record<string, string> = {
  'Watching': 'watching',
  'Completed': 'watched',
  'Watchlist': 'watchlist',
}

type Movie = typeof MOCK_MOVIES[0] & { poster?: string | null }

export default function MoviesPage() {
  const [tab, setTab] = useState('All Movies')
  const [movies, setMovies] = useState<Movie[]>([])

  useEffect(() => {
    fetch('/api/movies')
      .then(r => r.json())
      .then((data: Movie[]) => setMovies(data.length ? data : MOCK_MOVIES))
      .catch(() => setMovies(MOCK_MOVIES))
  }, [])

  const display = movies.length ? movies : MOCK_MOVIES
  const filtered = tab === 'All Movies' ? display : display.filter(m => m.status === STATUS_MAP[tab])
  const watched = display.filter(m => m.status === 'watched').length
  const watchlist = display.filter(m => m.status === 'watchlist').length

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Movies</h1>
          <p className="page-sub">{watched} watched · {watchlist} in watchlist</p>
        </div>
        <Link href="/add" className="btn btn-gold btn-sm">+ Add Movie</Link>
      </div>

      <div className="filter-tabs">
        {TABS.map(t => (
          <button key={t} className={`filter-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <div className="empty-text">Nothing here yet</div>
          <div className="empty-sub"><Link href="/add">Add your first movie</Link></div>
        </div>
      ) : (
        <div className="movie-grid">
          {filtered.map(m => (
            <div key={m.id} className="movie-card">
              <Poster poster={m.poster} title={m.title} />
              <div className="movie-title">{m.title}</div>
              <div className="movie-meta">
                {m.year} {m.rating && <span className="rating-star">★{m.rating}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
