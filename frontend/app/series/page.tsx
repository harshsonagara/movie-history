'use client'

import { useState, useEffect } from 'react'
import { MOCK_SERIES } from '@/lib/mock-data'
import Link from 'next/link'
import { Poster } from '@/components/Poster'

const TABS = ['All Shows', 'Watching', 'Completed', 'Watchlist']
const STATUS_MAP: Record<string, string> = {
  'Watching': 'watching',
  'Completed': 'completed',
  'Watchlist': 'watchlist',
}

type Series = typeof MOCK_SERIES[0] & { poster?: string | null; progress?: number | null }

export default function SeriesPage() {
  const [tab, setTab] = useState('All Shows')
  const [series, setSeries] = useState<Series[]>([])

  useEffect(() => {
    fetch('/api/series')
      .then(r => r.json())
      .then((data: Series[]) => setSeries(data.length ? data : MOCK_SERIES))
      .catch(() => setSeries(MOCK_SERIES))
  }, [])

  const display: Series[] = series.length ? series : (MOCK_SERIES as unknown as Series[])
  const filtered = tab === 'All Shows' ? display : display.filter(s => s.status === STATUS_MAP[tab])
  const watching = display.filter(s => s.status === 'watching').length
  const completed = display.filter(s => s.status === 'completed').length

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Series</h1>
          <p className="page-sub">{watching} watching · {completed} completed</p>
        </div>
        <Link href="/add" className="btn btn-gold btn-sm">+ Add Series</Link>
      </div>

      <div className="filter-tabs">
        {TABS.map(t => (
          <button key={t} className={`filter-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div className="movie-grid">
        {filtered.map(s => (
          <div key={s.id} className="movie-card">
            <Poster poster={s.poster} title={s.title} />
            {s.progress != null && (
              <div className="progress-bar">
                <div className="progress-fill" style={{ '--w': `${s.progress}%` } as React.CSSProperties} />
              </div>
            )}
            <div className="movie-title">{s.title}</div>
            <div className="movie-meta">
              {s.year}
              {(s as any).currentSeason && <span className="ml-1">S{(s as any).currentSeason}E{(s as any).currentEp}</span>}
              {s.rating && <span className="rating-star ml-1">★{s.rating}</span>}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
