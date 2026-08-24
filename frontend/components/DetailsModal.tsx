'use client'

import { X } from 'lucide-react'
import { Poster } from '@/components/Poster'

type DetailsItem = {
    type: 'movie' | 'series'
    title: string
    poster?: string | null
    year?: number | null
    genre?: string | null
    rating?: number | null
    status?: string | null
    notes?: string | null
    overview?: string | null
    runtime?: number | null
    currentSeason?: number | null
    currentEp?: number | null
    totalEps?: number | null
}

const STATUS_LABELS: Record<string, string> = {
    watched: 'Watched',
    watching: 'Watching',
    watchlist: 'Watchlist',
    completed: 'Completed',
}

export function DetailsModal({ item, onClose }: { item: DetailsItem; onClose: () => void }) {
    const episodeProgress =
        item.currentEp != null && item.totalEps != null && item.totalEps > 0
            ? Math.round((item.currentEp / item.totalEps) * 100)
            : null

    return (
        <div className="modal-backdrop" onClick={onClose}>
            <div className="modal details-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="modal-title">{item.title}</div>
                    <button className="modal-close" onClick={onClose}><X size={16} /></button>
                </div>

                <div className="details-top">
                    <Poster
                        poster={item.poster}
                        title={item.title}
                        imgClassName="details-poster"
                        placeholderClassName="details-poster-ph"
                    />
                    <div className="details-meta-list">
                        <div className="details-row">
                            <span className={`media-badge media-badge-${item.type}`}>{item.type === 'movie' ? 'Movie' : 'Series'}</span>
                            {item.status && <span className="details-chip">{STATUS_LABELS[item.status] ?? item.status}</span>}
                        </div>
                        <div className="details-row details-muted">
                            {item.year ?? 'Unknown year'}
                            {item.genre ? ` · ${item.genre}` : ''}
                            {item.runtime ? ` · ${item.runtime} min` : ''}
                        </div>
                        <div className="details-row">
                            {item.rating != null ? <span className="rating-star">★{item.rating}</span> : <span className="details-muted">Not rated</span>}
                        </div>

                        {item.type === 'series' && (
                            <>
                                <div className="details-row details-muted">
                                    Season {item.currentSeason ?? '—'} · Episode {item.currentEp ?? '—'}
                                    {item.totalEps != null ? ` / ${item.totalEps}` : ''}
                                </div>
                                {episodeProgress != null && (
                                    <div className="progress-bar details-progress">
                                        <div className="progress-fill" style={{ '--w': `${episodeProgress}%` } as React.CSSProperties} />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                <div className="details-overview-wrap">
                    <div className="details-overview-title">Description</div>
                    <div className="details-overview-scroll">
                        {item.overview?.trim() ? item.overview : 'No description added yet.'}
                    </div>
                </div>

                {item.notes?.trim() && (
                    <div className="details-overview-wrap" style={{ marginTop: 12 }}>
                        <div className="details-overview-title">Your Notes</div>
                        <div className="details-overview-scroll" style={{ color: 'var(--gold)', fontStyle: 'italic' }}>
                            {item.notes}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
