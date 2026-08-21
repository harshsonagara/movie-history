import { getHistory } from '@/lib/data'

function groupByDate(items: any[]) {
  const groups: Record<string, any[]> = {}
  for (const item of items) {
    const d = new Date(item.createdAt)
    const today = new Date()
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
    let label: string
    if (d.toDateString() === today.toDateString()) label = 'Today'
    else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday'
    else label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
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
  started: (i) => `Started${i.note ? ` · ${i.note}` : ''}`,
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export default async function HistoryPage() {
  const history = await getHistory()
  const groups  = groupByDate(history)

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">History</h1>
        <p className="page-sub">Your complete watch log</p>
      </div>

      {Object.entries(groups).map(([date, items]) => (
        <div key={date}>
          <div className="history-group-label">{date}</div>
          {items.map((item: any) => (
            <div key={item.id} className="history-item">
              <div className="history-thumb">{item.title[0]}</div>
              <div className="history-info">
                <div className="history-title">{item.title}</div>
                <div className="history-sub history-sub-row">
                  <span className={BADGE_CLASS[item.action]}>{item.action}</span>
                  <span>{ACTION_LABEL[item.action]?.(item)}</span>
                </div>
              </div>
              <div className="history-time">{timeAgo(item.createdAt)}</div>
            </div>
          ))}
        </div>
      ))}

      {history.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <div className="empty-text">No history yet</div>
          <div className="empty-sub">Start watching to build your log</div>
        </div>
      )}
    </>
  )
}
