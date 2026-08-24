'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Poster } from '@/components/Poster'
import { DetailsModal } from '@/components/DetailsModal'

type WLItem = {
  id: number; tmdbId: number; title: string; year?: number | null
  genre?: string | null; runtime?: number | null; poster?: string | null
  overview?: string | null; rating?: number | null; status?: string
  currentSeason?: number | null; currentEp?: number | null; totalEps?: number | null
  mediaType: 'movie' | 'series'
}

type BaseEntry = {
  id: number
  status: string
}

type MovieEntry = BaseEntry & {
  tmdbId: number
  title: string
  year?: number | null
  genre?: string | null
  runtime?: number | null
  poster?: string | null
  overview?: string | null
  rating?: number | null
}

type SeriesEntry = BaseEntry & {
  tmdbId: number
  title: string
  year?: number | null
  genre?: string | null
  poster?: string | null
  overview?: string | null
  rating?: number | null
  currentSeason?: number | null
  currentEp?: number | null
  totalEps?: number | null
}

export default function WatchlistPage() {
  const [items, setItems] = useState<WLItem[]>([])
  const [loading, setLoading] = useState(true)
  const [viewing, setViewing] = useState<WLItem | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/movies').then(r => r.json()),
      fetch('/api/series').then(r => r.json()),
    ]).then(([movies, series]) => {
      const wlMovies: WLItem[] = (Array.isArray(movies) ? movies as MovieEntry[] : [])
        .filter(m => m.status === 'watchlist')
        .map(m => ({ ...m, mediaType: 'movie' as const }))
      const wlSeries: WLItem[] = (Array.isArray(series) ? series as SeriesEntry[] : [])
        .filter(s => s.status === 'watchlist')
        .map(s => ({ ...s, mediaType: 'series' as const }))
      setItems([...wlMovies, ...wlSeries])
    }).catch(() => { }).finally(() => setLoading(false))
  }, [])

  async function markWatched(item: WLItem) {
    const endpoint = item.mediaType === 'movie' ? 'movies' : 'series'
    const newStatus = item.mediaType === 'movie' ? 'watched' : 'completed'
    setItems(prev => prev.filter(i => !(i.id === item.id && i.mediaType === item.mediaType)))
    await fetch(`/api/${endpoint}/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  async function removeItem(item: WLItem) {
    if (!confirm(`Remove "${item.title}" from your watchlist?`)) return
    setItems(prev => prev.filter(i => !(i.id === item.id && i.mediaType === item.mediaType)))
    await fetch(`/api/${item.mediaType === 'movie' ? 'movies' : 'series'}/${item.id}`, {
      method: 'DELETE',
    })
  }

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Watchlist</h1>
          <p className="page-sub">{items.length} titles queued up</p>
        </div>
        <Link href="/add" className="btn btn-gold btn-sm">+ Add Title</Link>
      </div>

      {loading ? (
        <div className="card">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-row" style={{ padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
              <div className="skeleton skeleton-thumb-sm" />
              <div className="skeleton-lines">
                <div className="skeleton skeleton-line-lg" />
                <div className="skeleton skeleton-line-sm mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <div className="empty-text">Your watchlist is empty</div>
          <div className="empty-sub"><Link href="/add">Search and add titles</Link></div>
        </div>
      ) : (
        <div className="card">
          {items.map(item => (
            <div key={`${item.mediaType}-${item.id}`} className="watchlist-item">
              <div className="card-open-surface" onClick={() => setViewing(item)}>
                <Poster
                  poster={item.poster}
                  title={item.title}
                  imgClassName="watchlist-poster-img"
                  placeholderClassName="watchlist-thumb"
                />
              </div>
              <div className="watchlist-info">
                <div className="watchlist-title card-open-surface" onClick={() => setViewing(item)}>
                  {item.title}
                  <span className={`media-badge media-badge-${item.mediaType}`}>
                    {item.mediaType === 'movie' ? 'Movie' : 'Series'}
                  </span>
                </div>
                <div className="watchlist-meta card-open-surface" onClick={() => setViewing(item)}>
                  {item.year}{item.genre ? ` · ${item.genre}` : ''}{item.runtime ? ` · ${item.runtime}min` : ''}
                </div>
              </div>
              <div className="watchlist-actions">
                <button className="btn btn-gold btn-sm" onClick={() => markWatched(item)}>
                  ✓ Watched
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => removeItem(item)}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewing && (
        <DetailsModal
          item={{
            type: viewing.mediaType,
            title: viewing.title,
            poster: viewing.poster,
            year: viewing.year,
            genre: viewing.genre,
            rating: viewing.rating,
            status: viewing.status,
            runtime: viewing.runtime,
            overview: viewing.overview,
            currentSeason: viewing.currentSeason,
            currentEp: viewing.currentEp,
            totalEps: viewing.totalEps,
          }}
          onClose={() => setViewing(null)}
        />
      )}
    </>
  )
}
