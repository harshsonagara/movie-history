import { getHistory } from '@/lib/data'
import { Poster } from '@/components/Poster'
import Link from 'next/link'

function groupByDate(items: any[]) {
  const groups: Record<string, any[]> = {}
  for (const item of items) {
    const d = new Date(item.createdAt)
    const today     = new Date()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    let label: string
    if (d.toDateString() === today.toDateString())     label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    ;(groups[label] ??= []).push(item)
  }
  return groups
}

const BADGE_CLASS: Record<string, string> = {
  watched: 'badge badge-watched',
  rated:   'badge badge-rated',
  added:   'badge badge-added',
  started: 'badge badge-started',
}

const ACTION_LABEL: Record<string, (item: any) => string> = {
  watched: (i) => `Watched${i.note ? ` · ${i.note}` : ''}`,
  rated:   (i) => `Rated ${i.rating}★`,
  added:   () => 'Added to watchlist',
  started: (i) => `Started watching${i.note ? ` · ${i.note}` : ''}`,
}

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default async function HistoryPage() {
  const history = await getHistory()
  const groups  = groupByDate(history)

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-sub">{history.length} entries in your watch log</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <div className="empty-text">No history yet</div>
          <div className="empty-sub">
            <Link href="/add">Add movies &amp; series</Link> to start building your log
          </div>
        </div>
      ) : (
        Object.entries(groups).map(([date, items]) => (
          <div key={date} className="section">
            <div className="history-group-label">{date}</div>
            {items.map((item: any) => (
              <div key={item.id} className="history-item">
                <Poster
                  poster={item.poster}
                  title={item.title}
                  imgClassName="history-poster-img"
                  placeholderClassName="history-thumb"
                />
                <div className="history-info">
                  <div className="history-title">{item.title}</div>
                  <div className="history-sub history-sub-row">
                    <span className={BADGE_CLASS[item.action] ?? 'badge'}>{item.action}</span>
                    <span className="history-sub">{ACTION_LABEL[item.action]?.(item)}</span>
                    <span className={`media-badge media-badge-${item.mediaType === 'movie' ? 'movie' : 'series'}`}>
                      {item.mediaType === 'movie' ? 'Movie' : 'Series'}
                    </span>
                  </div>
                </div>
                <div className="history-time">{timeStr(item.createdAt)}</div>
              </div>
            ))}
          </div>
        ))
      )}
    </>
  )
}
