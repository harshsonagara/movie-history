import { getWatchlist } from '@/lib/data'
import Link from 'next/link'

export default async function WatchlistPage() {
  const items = await getWatchlist()

  return (
    <>
      <div className="page-header-row">
        <div>
          <h1 className="page-title">Watchlist</h1>
          <p className="page-sub">{items.length} titles to watch</p>
        </div>
        <Link href="/add" className="btn btn-gold btn-sm">+ Add Title</Link>
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <div className="empty-text">Your watchlist is empty</div>
          <div className="empty-sub"><Link href="/add">Search and add titles</Link></div>
        </div>
      ) : (
        <div className="card">
          {items.map((item: any) => (
            <div key={item.id} className="watchlist-item">
              <div className="watchlist-thumb">{item.title[0]}</div>
              <div className="watchlist-info">
                <div className="watchlist-title">{item.title}</div>
                <div className="watchlist-meta">
                  {item.year} · {item.genre ?? 'Unknown'}
                  {item.runtime && ` · ${item.runtime}min`}
                </div>
              </div>
              <div className="watchlist-actions">
                <button className="btn btn-gold btn-sm">Mark Watched</button>
                <button className="btn btn-ghost btn-sm">Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
