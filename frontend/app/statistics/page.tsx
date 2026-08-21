import { getStats } from '@/lib/data'
import { MonthlyBarChart, GenrePieChart } from '@/components/Charts'

export default async function StatisticsPage() {
  const stats = await getStats()
  const maxRating = stats.ratingDistribution.length > 0
    ? Math.max(...stats.ratingDistribution.map(r => r.count))
    : 1
  const days = Math.round(stats.hoursWatched / 24)

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">Statistics</h1>
      </div>

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
          <div className="stat-sub">{days > 0 ? `≈ ${days} day${days === 1 ? '' : 's'}` : 'Based on runtimes'}</div>
        </div>
        <div className="card stat-purple">
          <div className="stat-number">{stats.avgRating > 0 ? `${stats.avgRating} ★` : '—'}</div>
          <div className="stat-label">Avg Rating</div>
          <div className="stat-sub">{stats.ratedCount} rated</div>
        </div>
      </div>

      {stats.monthlyData.length > 0 || stats.genres.length > 0 ? (
        <div className="charts-grid">
          <div className="card">
            <div className="section-title mb-5">Watched — {new Date().getFullYear()}</div>
            <MonthlyBarChart data={stats.monthlyData} />
          </div>

          <div className="card">
            <div className="section-title mb-4">By Genre</div>
            {stats.genres.length > 0 ? (
              <>
                <div className="chart-center-wrap">
                  <GenrePieChart data={stats.genres} total={stats.moviesWatched + stats.showsTracked} />
                  <div className="chart-center-overlay">
                    <div>
                      <div className="chart-center-num">{stats.moviesWatched + stats.showsTracked}</div>
                      <div className="chart-center-label">TITLES</div>
                    </div>
                  </div>
                </div>
                <div className="genre-list">
                  {stats.genres.map(g => (
                    <div key={g.name} className="genre-row">
                      <div className="genre-dot" style={{ '--dot-color': g.color } as React.CSSProperties} />
                      <div className="genre-name">{g.name}</div>
                      <div className="genre-pct">{g.percent}%</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state empty-state-sm">
                <div className="empty-sub">Add movies to see genre breakdown</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <div className="empty-text">No chart data yet</div>
            <div className="empty-sub">Start adding and watching titles to see your statistics</div>
          </div>
        </div>
      )}

      <div className="stats-grid-2">
        <div className="card">
          <div className="section-title mb-4">Rating Distribution</div>
          {stats.ratingDistribution.length > 0 ? (
            stats.ratingDistribution.map(r => (
              <div key={r.rating} className="rating-row">
                <div className="rating-label">{r.rating}</div>
                <div className="rating-track">
                  <div className="rating-fill" style={{ '--w': `${(r.count / maxRating) * 100}%` } as React.CSSProperties} />
                </div>
                <div className="rating-count">{r.count}</div>
              </div>
            ))
          ) : (
            <div className="empty-state empty-state-sm">
              <div className="empty-sub">Rate movies to see distribution</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="section-title mb-4">Top Directors</div>
          {stats.topDirectors.length > 0 ? (
            stats.topDirectors.map((d, i) => (
              <div key={d.name} className="director-item">
                <div className="director-rank">{i + 1}</div>
                <div>
                  <div className="director-name">{d.name}</div>
                  <div className="director-films">{d.films} film{d.films > 1 ? 's' : ''}</div>
                </div>
                <div className="director-rating">★ {d.avgRating}</div>
              </div>
            ))
          ) : (
            <div className="empty-state empty-state-sm">
              <div className="empty-sub">Watch more movies to see top directors</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
