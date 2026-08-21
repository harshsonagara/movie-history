'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { Poster } from '@/components/Poster'
import { EditModal, type EditTarget } from '@/components/EditModal'

type Movie = {
  id: number; tmdbId: number; title: string; year?: number | null
  rating?: number | null; genre?: string | null; status: string
  poster?: string | null; runtime?: number | null
}

const SECTIONS = [
  { label: 'Currently Watching', status: 'watching'  },
  { label: 'Your Watchlist',     status: 'watchlist' },
  { label: 'Watched',            status: 'watched'   },
]

export default function MoviesPage() {
  const [movies,  setMovies]  = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EditTarget | null>(null)

  useEffect(() => {
    fetch('/api/movies')
      .then(r => r.json())
      .then((data: Movie[]) => setMovies(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function deleteMovie(m: Movie) {
    if (!confirm(`Remove "${m.title}" from your library?`)) return
    setMovies(prev => prev.filter(x => x.id !== m.id))
    await fetch(`/api/movies/${m.id}`, { method: 'DELETE' })
  }

  function onSaved(id: number, patch: Partial<EditTarget>) {
    setMovies(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m))
    setEditing(null)
  }

  const watched   = movies.filter(m => m.status === 'watched').length
  const watchlist = movies.filter(m => m.status === 'watchlist').length

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Movies</h1>
          <p className="page-sub">{watched} watched · {watchlist} in watchlist</p>
        </div>
        <Link href="/add" className="btn btn-gold btn-sm">+ Add Movie</Link>
      </div>

      {loading && (
        <div className="movie-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton skeleton-aspect" />
              <div className="skeleton skeleton-caption mt-2" />
            </div>
          ))}
        </div>
      )}

      {!loading && movies.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <div className="empty-text">No movies yet</div>
          <div className="empty-sub"><Link href="/add">Add your first movie</Link></div>
        </div>
      )}

      {!loading && SECTIONS.map(sec => {
        const items = movies.filter(m => m.status === sec.status)
        if (!items.length) return null
        return (
          <div key={sec.status} className="section">
            <div className="section-heading">
              <span className="section-heading-label">{sec.label}</span>
              <span className="section-heading-count">{items.length}</span>
            </div>
            <div className="movie-grid">
              {items.map(m => (
                <div key={m.id} className="movie-card">
                  <div className="poster-wrap">
                    <Poster poster={m.poster} title={m.title} />
                    <div className="card-actions">
                      <button
                        className="card-action-btn card-action-edit"
                        title="Edit"
                        onClick={() => setEditing({ id: m.id, type: 'movie', title: m.title, status: m.status, rating: m.rating })}
                      >
                        <Pencil size={12} />
                      </button>
                      <button
                        className="card-action-btn card-action-delete"
                        title="Remove"
                        onClick={() => deleteMovie(m)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="movie-title">{m.title}</div>
                  <div className="movie-meta">
                    {m.year} {m.rating != null && <span className="rating-star">★{m.rating}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {editing && (
        <EditModal
          item={editing}
          onClose={() => setEditing(null)}
          onSave={patch => onSaved(editing.id, patch)}
        />
      )}
    </>
  )
}
