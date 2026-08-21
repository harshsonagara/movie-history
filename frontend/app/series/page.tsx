'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { Poster } from '@/components/Poster'
import { EditModal, type EditTarget } from '@/components/EditModal'

type Series = {
  id: number; tmdbId: number; title: string; year?: number | null
  rating?: number | null; genre?: string | null; status: string
  poster?: string | null; currentSeason?: number | null
  currentEp?: number | null; totalEps?: number | null
}

const SECTIONS = [
  { label: 'Continue Watching', status: 'watching'  },
  { label: 'Your Watchlist',    status: 'watchlist' },
  { label: 'Completed',         status: 'completed' },
]

export default function SeriesPage() {
  const [series,  setSeries]  = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EditTarget | null>(null)

  useEffect(() => {
    fetch('/api/series')
      .then(r => r.json())
      .then((data: Series[]) => setSeries(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function deleteSeries(s: Series) {
    if (!confirm(`Remove "${s.title}" from your library?`)) return
    setSeries(prev => prev.filter(x => x.id !== s.id))
    await fetch(`/api/series/${s.id}`, { method: 'DELETE' })
  }

  function onSaved(id: number, patch: Partial<EditTarget>) {
    setSeries(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))
    setEditing(null)
  }

  const watching  = series.filter(s => s.status === 'watching').length
  const completed = series.filter(s => s.status === 'completed').length

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Series</h1>
          <p className="page-sub">{watching} watching · {completed} completed</p>
        </div>
        <Link href="/add" className="btn btn-gold btn-sm">+ Add Series</Link>
      </div>

      {loading && (
        <div className="movie-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton skeleton-aspect" />
              <div className="skeleton skeleton-caption mt-2" />
            </div>
          ))}
        </div>
      )}

      {!loading && series.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📺</div>
          <div className="empty-text">No shows yet</div>
          <div className="empty-sub"><Link href="/add">Start tracking a show</Link></div>
        </div>
      )}

      {!loading && SECTIONS.map(sec => {
        const items = series.filter(s => s.status === sec.status)
        if (!items.length) return null
        return (
          <div key={sec.status} className="section">
            <div className="section-heading">
              <span className="section-heading-label">{sec.label}</span>
              <span className="section-heading-count">{items.length}</span>
            </div>
            <div className="movie-grid">
              {items.map(s => {
                const prog = s.totalEps && s.currentEp
                  ? Math.round((s.currentEp / s.totalEps) * 100)
                  : null
                return (
                  <div key={s.id} className="movie-card">
                    <div className="poster-wrap">
                      <Poster poster={s.poster} title={s.title} />
                      {prog != null && (
                        <div className="poster-progress">
                          <div className="progress-fill" style={{ '--w': `${prog}%` } as React.CSSProperties} />
                        </div>
                      )}
                      <div className="card-actions">
                        <button
                          className="card-action-btn card-action-edit"
                          title="Edit"
                          onClick={() => setEditing({
                            id: s.id, type: 'series', title: s.title, status: s.status,
                            rating: s.rating, currentSeason: s.currentSeason, currentEp: s.currentEp,
                          })}
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          className="card-action-btn card-action-delete"
                          title="Remove"
                          onClick={() => deleteSeries(s)}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="movie-title">{s.title}</div>
                    <div className="movie-meta">
                      {s.year}
                      {s.currentSeason != null && (
                        <span className="ml-1">S{s.currentSeason}E{s.currentEp ?? '?'}</span>
                      )}
                      {s.rating != null && <span className="rating-star ml-1">★{s.rating}</span>}
                    </div>
                  </div>
                )
              })}
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
