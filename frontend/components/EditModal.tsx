'use client'
import { useState } from 'react'
import { X } from 'lucide-react'

export type EditTarget = {
  id: number
  type: 'movie' | 'series'
  title: string
  status: string
  rating?: number | null
  currentSeason?: number | null
  currentEp?: number | null
  totalEps?: number | null
}

export function EditModal({
  item, onClose, onSave,
}: {
  item: EditTarget
  onClose: () => void
  onSave: (patch: Partial<EditTarget>) => void
}) {
  const [status, setStatus] = useState(item.status)
  const [rating, setRating] = useState(item.rating?.toString() ?? '')
  const [season, setSeason] = useState(item.currentSeason?.toString() ?? '')
  const [ep, setEp] = useState(item.currentEp?.toString() ?? '')
  const [totalEp, setTotalEp] = useState(item.totalEps?.toString() ?? '')
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const patch: Record<string, unknown> = { status }
    patch.rating = rating !== '' ? parseFloat(rating) : null
    if (item.type === 'series') {
      patch.currentSeason = season !== '' ? parseInt(season) : null
      patch.currentEp = ep !== '' ? parseInt(ep) : null
      patch.totalEps = totalEp !== '' ? parseInt(totalEp) : null
    }
    const endpoint = item.type === 'movie' ? 'movies' : 'series'
    try {
      const res = await fetch(`/api/${endpoint}/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (res.ok) onSave(patch as Partial<EditTarget>)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{item.title}</div>
          <button className="modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="form-group">
          <label>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            {item.type === 'movie' ? (
              <>
                <option value="watching">Currently Watching</option>
                <option value="watched">Watched</option>
                <option value="watchlist">Watchlist</option>
              </>
            ) : (
              <>
                <option value="watching">Currently Watching</option>
                <option value="completed">Completed</option>
                <option value="watchlist">Watchlist</option>
              </>
            )}
          </select>
        </div>

        <div className="form-group">
          <label>Rating (1–10, optional)</label>
          <input
            className="form-input"
            type="number" min="1" max="10" step="0.5"
            placeholder="Leave blank to clear"
            value={rating}
            onChange={e => setRating(e.target.value)}
          />
        </div>

        {item.type === 'series' && (
          <div className="modal-three-col">
            <div className="form-group">
              <label>Season</label>
              <input
                className="form-input"
                type="number" min="1" placeholder="—"
                value={season} onChange={e => setSeason(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Episode</label>
              <input
                className="form-input"
                type="number" min="1" placeholder="—"
                value={ep} onChange={e => setEp(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Total Episodes</label>
              <input
                className="form-input"
                type="number" min="1" placeholder="—"
                value={totalEp} onChange={e => setTotalEp(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold btn-sm" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
