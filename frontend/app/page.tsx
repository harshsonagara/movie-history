import Link from 'next/link'
import { getMovies, getSeries, getHistory, getStats, getTrending } from '@/lib/data'
import { Poster } from '@/components/Poster'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(iso: Date | string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3600000)
  const d = Math.floor(diff / 86400000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  if (d === 1) return 'yesterday'
  return `${d}d ago`
}

export default async function Dashboard() {
  const [movies, series, history, stats, trending] = await Promise.all([
    getMovies(), getSeries(), getHistory(), getStats(), getTrending(),
  ])
  // ponytail: compute watchlist count from already-fetched data instead of extra DB call

  const watching = series.filter(s => s.status === 'watching').slice(0, 4)
  const recent   = movies.filter(m => m.status === 'watched').slice(0, 8)
  const activity = history.slice(0, 5)
  const upNext   = [
    ...movies.filter(m => m.status === 'watchlist').map(m => ({ ...m, mediaType: 'movie' as const })),
    ...series.filter(s => s.status === 'watchlist').map(s => ({ ...s, mediaType: 'series' as const })),
  ].slice(0, 5)

  const oneWeekAgo   = Date.now() - 7 * 86400000
  const thisWeekCount = history.filter(h => new Date(h.createdAt).getTime() > oneWeekAgo).length
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">{greeting()} 👋</h1>
        <p className="page-sub">
          {today}
          {thisWeekCount > 0 && ` · ${thisWeekCount} log entr${thisWeekCount === 1 ? 'y' : 'ies'} this week`}
        </p>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="card stat-gold">
          <div className="stat-number">{stats.moviesWatched}</div>
          <div className="stat-label">Movies Watched</div>
          <div className="stat-sub">All time</div>
        </div>
        <div className="card stat-blue">
          <div className="stat-number">{stats.showsTracked}</div>
          <div className="stat-label">Shows Tracked</div>
          <div className="stat-sub">{stats.currentlyWatching} watching · {stats.watchlistCount} in queue</div>
        </div>
        <div className="card stat-teal">
          <div className="stat-number">{stats.hoursWatched.toLocaleString()}h</div>
          <div className="stat-label">Hours Watched</div>
          <div className="stat-sub">Based on runtimes</div>
        </div>
        <div className="card stat-purple">
          <div className="stat-number">{stats.avgRating > 0 ? `${stats.avgRating} ★` : '—'}</div>
          <div className="stat-label">Avg Rating</div>
          <div className="stat-sub">{stats.ratedCount} rated</div>
        </div>
      </div>

      {/* Continue Watching */}
      {watching.length > 0 && (
        <div className="section">
          <div className="section-row">
            <h2 className="section-title">Continue Watching</h2>
            <Link href="/series" className="see-all">All Series →</Link>
          </div>
          <div className="scroll-row">
            {watching.map(s => {
              const prog = (s as any).totalEps && (s as any).currentEp
                ? Math.round(((s as any).currentEp / (s as any).totalEps) * 100)
                : null
              return (
                <div key={s.id} className="continue-card">
                  <Poster
                    poster={(s as any).poster}
                    title={s.title}
                    imgClassName="continue-poster"
                    placeholderClassName="continue-poster-placeholder"
                  />
                  <div className="continue-info">
                    <div className="continue-title">{s.title}</div>
                    <div className="continue-sub">
                      {(s as any).currentSeason != null
                        ? `S${(s as any).currentSeason}E${(s as any).currentEp ?? '?'}`
                        : 'In progress'}
                    </div>
                    {prog != null && (
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ '--w': `${prog}%` } as React.CSSProperties} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recently Watched */}
      {recent.length > 0 && (
        <div className="section">
          <div className="section-row">
            <h2 className="section-title">Recently Watched</h2>
            <Link href="/movies" className="see-all">All Movies →</Link>
          </div>
          <div className="scroll-row">
            {recent.map(m => (
              <div key={m.id} className="recent-item">
                <Poster
                  poster={(m as any).poster}
                  title={m.title}
                  imgClassName="recent-poster"
                  placeholderClassName="recent-poster-placeholder"
                />
                <div className="movie-title">{m.title}</div>
                <div className="movie-meta">
                  {(m as any).year} {(m as any).rating && <span className="rating-star">★{(m as any).rating}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity + Up Next */}
      {/* <div className="two-col">
        <div className="card">
          <div className="section-row mb-4">
            <h3 className="section-title-sm">Recent Activity</h3>
          </div>
          {activity.length === 0 ? (
            <div className="empty-state empty-state-sm">
              <div className="empty-sub">No activity yet</div>
            </div>
          ) : (
            <div className="activity-list">
              {activity.map(item => (
                <div key={item.id} className="activity-item">
                  <div className="activity-dot" />
                  <div>
                    <div className="activity-text">
                      {item.action === 'rated'   && `Rated ${item.title} ${item.rating}★`}
                      {item.action === 'watched' && `Watched ${item.title}${item.note ? ` · ${item.note}` : ''}`}
                      {item.action === 'added'   && `Added ${item.title} to watchlist`}
                      {item.action === 'started' && `Started ${item.title}`}
                    </div>
                    <div className="activity-time">{timeAgo(item.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-row mb-4">
            <h3 className="section-title-sm">Up Next</h3>
          </div>
          {upNext.length === 0 ? (
            <div className="empty-state empty-state-sm">
              <div className="empty-sub">Watchlist is empty</div>
            </div>
          ) : (
            <div>
              {upNext.map(m => (
                <div key={`${m.mediaType}-${m.id}`} className="watchlist-item">
                  <Poster
                    poster={(m as any).poster}
                    title={m.title}
                    imgClassName="watchlist-poster-img"
                    placeholderClassName="watchlist-thumb"
                  />
                  <div className="watchlist-info">
                    <div className="watchlist-title">
                      {m.title}
                      <span className={`media-badge media-badge-${m.mediaType}`}>
                        {m.mediaType === 'movie' ? 'Movie' : 'Series'}
                      </span>
                    </div>
                    <div className="watchlist-meta">{(m as any).year} · {(m as any).genre ?? 'Unknown'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link href="/watchlist" className="btn btn-ghost btn-sm mt-4 w-full justify-center">
            View Watchlist →
          </Link>
        </div>
      </div> */}

      {/* Trending Recommendations */}
      {/* {trending.length > 0 && (
        <div className="section">
          <div className="section-row">
            <div>
              <h2 className="section-title">Recommended for You</h2>
              <p className="page-sub" style={{ marginTop: 2 }}>Trending this week on TMDB</p>
            </div>
            <Link href="/add" className="see-all">Search & Add →</Link>
          </div>
          <div className="scroll-row">
            {trending.map(t => {
              const title = t.title ?? t.name ?? ''
              const year  = (t.release_date ?? t.first_air_date ?? '').slice(0, 4)
              const type  = t.media_type === 'tv' ? 'series' : 'movie'
              return (
                <Link key={t.id} href="/add" className="recent-item trending-link">
                  <Poster
                    poster={t.poster_path}
                    title={title}
                    imgClassName="recent-poster"
                    placeholderClassName="recent-poster-placeholder"
                  />
                  <div className="movie-title">{title}</div>
                  <div className="movie-meta">
                    {year}
                    <span className={`media-badge media-badge-${type}`}>
                      {type === 'movie' ? 'Movie' : 'Series'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )} */}
    </>
  )
}
