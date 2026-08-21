import { getStats } from '@/lib/data'
import { MonthlyBarChart, GenrePieChart } from '@/components/Charts'

export default async function StatisticsPage() {
  const stats = await getStats()

  const maxRating = Math.max(...stats.ratingDistribution.map(r => r.count))

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
          <div className="stat-sub">{stats.currentlyWatching} watching</div>
        </div>
        <div className="card stat-teal">
          <div className="stat-number">{stats.hoursWatched.toLocaleString()}h</div>
          <div className="stat-label">Hours</div>
          <div className="stat-sub">−77 days</div>
        </div>
        <div className="card stat-purple">
          <div className="stat-number">{stats.avgRating} ★</div>
          <div className="stat-label">Avg Rating</div>
          <div className="stat-sub">{stats.ratedCount} rated</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="card">
          <div className="section-title mb-5">Titles Watched — {new Date().getFullYear()}</div>
          <MonthlyBarChart data={stats.monthlyData} />
        </div>

        <div className="card">
          <div className="section-title mb-4">By Genre</div>
          <div className="chart-center-wrap">
            <GenrePieChart data={stats.genres} total={stats.moviesWatched} />
            <div className="chart-center-overlay">
              <div>
                <div className="chart-center-num">{stats.moviesWatched}</div>
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
        </div>
      </div>

      <div className="stats-grid-2">
        <div className="card">
          <div className="section-title mb-4">Rating Distribution</div>
          {stats.ratingDistribution.map(r => (
            <div key={r.rating} className="rating-row">
              <div className="rating-label">{r.rating}</div>
              <div className="rating-track">
                <div className="rating-fill" style={{ '--w': `${(r.count / maxRating) * 100}%` } as React.CSSProperties} />
              </div>
              <div className="rating-count">{r.count}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="section-title mb-4">Top Directors</div>
          {stats.topDirectors.map((d, i) => (
            <div key={d.name} className="director-item">
              <div className="director-rank">{i + 1}</div>
              <div>
                <div className="director-name">{d.name}</div>
                <div className="director-films">{d.films} film{d.films > 1 ? 's' : ''}</div>
              </div>
              <div className="director-rating">★ {d.avgRating}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
