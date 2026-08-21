export type Movie = {
  id: number
  tmdbId: number
  title: string
  year: number
  rating: number | null
  genre: string
  status: 'watched' | 'watching' | 'watchlist'
  poster: string | null
  progress?: number
  runtime?: number
  director?: string
  overview?: string
}

export type Series = {
  id: number
  tmdbId: number
  title: string
  year: number
  rating: number | null
  genre: string
  status: 'watching' | 'completed' | 'watchlist'
  poster: string | null
  currentSeason?: number
  currentEp?: number
  totalEps?: number
  overview?: string
}

export type HistoryItem = {
  id: number
  mediaType: 'movie' | 'series'
  tmdbId: number
  title: string
  poster: string | null
  action: 'watched' | 'rated' | 'added' | 'started'
  rating?: number
  note?: string
  createdAt: string
}

export const MOCK_MOVIES: Movie[] = [
  { id: 1, tmdbId: 872585, title: 'Oppenheimer', year: 2023, rating: 8.5, genre: 'Drama', status: 'watched', poster: null, runtime: 181, director: 'Christopher Nolan', overview: 'The story of J. Robert Oppenheimer and his role in the development of the atomic bomb.' },
  { id: 2, tmdbId: 693134, title: 'Dune: Part Two', year: 2024, rating: 8.2, genre: 'Sci-Fi', status: 'watched', poster: null, runtime: 167, director: 'Denis Villeneuve', overview: 'Paul Atreides unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.' },
  { id: 3, tmdbId: 792307, title: 'Poor Things', year: 2023, rating: 8.0, genre: 'Drama', status: 'watched', poster: null, runtime: 141, director: 'Yorgos Lanthimos' },
  { id: 4, tmdbId: 27205, title: 'Inception', year: 2010, rating: 8.8, genre: 'Sci-Fi', status: 'watched', poster: null, runtime: 148, director: 'Christopher Nolan' },
  { id: 5, tmdbId: 157336, title: 'Interstellar', year: 2014, rating: 8.6, genre: 'Sci-Fi', status: 'watched', poster: null, runtime: 169, director: 'Christopher Nolan' },
  { id: 6, tmdbId: 155, title: 'The Dark Knight', year: 2008, rating: 9.0, genre: 'Action', status: 'watched', poster: null, runtime: 152, director: 'Christopher Nolan' },
  { id: 7, tmdbId: 496243, title: 'Parasite', year: 2019, rating: 8.5, genre: 'Thriller', status: 'watched', poster: null, runtime: 132, director: 'Bong Joon-ho' },
  { id: 8, tmdbId: 313369, title: 'La La Land', year: 2016, rating: 8.0, genre: 'Romance', status: 'watched', poster: null, runtime: 128, director: 'Damien Chazelle' },
  { id: 9, tmdbId: 244786, title: 'Whiplash', year: 2014, rating: 8.5, genre: 'Drama', status: 'watched', poster: null, runtime: 107, director: 'Damien Chazelle' },
  { id: 10, tmdbId: 76341, title: 'Mad Max: Fury Road', year: 2015, rating: 8.1, genre: 'Action', status: 'watched', poster: null, runtime: 120, director: 'George Miller' },
  { id: 11, tmdbId: 673, title: 'Tenet', year: 2020, rating: 7.3, genre: 'Sci-Fi', status: 'watched', poster: null, runtime: 150, director: 'Christopher Nolan' },
  { id: 12, tmdbId: 335984, title: 'Blade Runner 2049', year: 2017, rating: 8.0, genre: 'Sci-Fi', status: 'watched', poster: null, runtime: 164, director: 'Denis Villeneuve' },
  { id: 13, tmdbId: 281957, title: 'The Revenant', year: 2015, rating: 7.7, genre: 'Drama', status: 'watched', poster: null, runtime: 156, director: 'Alejandro González Iñárritu' },
  { id: 14, tmdbId: 329865, title: 'Arrival', year: 2016, rating: 8.0, genre: 'Sci-Fi', status: 'watched', poster: null, runtime: 116, director: 'Denis Villeneuve' },
  { id: 15, tmdbId: 120467, title: 'The Grand Budapest Hotel', year: 2014, rating: 8.1, genre: 'Comedy', status: 'watchlist', poster: null, runtime: 99, director: 'Wes Anderson' },
  { id: 16, tmdbId: 530385, title: 'Midsommar', year: 2019, rating: 7.4, genre: 'Horror', status: 'watchlist', poster: null, runtime: 148, director: 'Ari Aster' },
]

export const MOCK_SERIES: Series[] = [
  { id: 1, tmdbId: 95396, title: 'Severance', year: 2022, rating: 8.7, genre: 'Thriller', status: 'watching', poster: null, currentSeason: 2, currentEp: 4, totalEps: 10 },
  { id: 2, tmdbId: 100088, title: 'The Last of Us', year: 2023, rating: 8.8, genre: 'Drama', status: 'watching', poster: null, currentSeason: 2, currentEp: 3, totalEps: 7 },
  { id: 3, tmdbId: 94997, title: 'House of the Dragon', year: 2022, rating: 8.1, genre: 'Drama', status: 'watching', poster: null, currentSeason: 2, currentEp: 6, totalEps: 8 },
  { id: 4, tmdbId: 136315, title: 'The Bear', year: 2022, rating: 8.7, genre: 'Drama', status: 'watching', poster: null, currentSeason: 3, currentEp: 2, totalEps: 10 },
  { id: 5, tmdbId: 1396, title: 'Breaking Bad', year: 2008, rating: 9.5, genre: 'Crime', status: 'completed', poster: null, currentSeason: 5, currentEp: 62, totalEps: 62 },
  { id: 6, tmdbId: 60059, title: 'Better Call Saul', year: 2015, rating: 9.0, genre: 'Crime', status: 'completed', poster: null, currentSeason: 6, currentEp: 63, totalEps: 63 },
  { id: 7, tmdbId: 69428, title: 'Succession', year: 2018, rating: 8.8, genre: 'Drama', status: 'completed', poster: null, totalEps: 39 },
  { id: 8, tmdbId: 87108, title: 'Chernobyl', year: 2019, rating: 9.4, genre: 'Drama', status: 'completed', poster: null, totalEps: 5 },
]

export const MOCK_HISTORY: HistoryItem[] = [
  { id: 1, mediaType: 'series', tmdbId: 95396, title: 'Severance', poster: null, action: 'watched', note: 'S2E4', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, mediaType: 'movie', tmdbId: 693134, title: 'Dune: Part Two', poster: null, action: 'rated', rating: 8.2, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 3, mediaType: 'movie', tmdbId: 120467, title: 'The Grand Budapest Hotel', poster: null, action: 'added', createdAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 4, mediaType: 'series', tmdbId: 100088, title: 'The Last of Us', poster: null, action: 'watched', note: 'S2E3', createdAt: new Date(Date.now() - 259200000).toISOString() },
  { id: 5, mediaType: 'movie', tmdbId: 872585, title: 'Oppenheimer', poster: null, action: 'rated', rating: 8.5, createdAt: new Date(Date.now() - 345600000).toISOString() },
  { id: 6, mediaType: 'series', tmdbId: 94997, title: 'House of the Dragon', poster: null, action: 'watched', note: 'S2E6', createdAt: new Date(Date.now() - 432000000).toISOString() },
  { id: 7, mediaType: 'movie', tmdbId: 27205, title: 'Inception', poster: null, action: 'watched', createdAt: new Date(Date.now() - 518400000).toISOString() },
  { id: 8, mediaType: 'series', tmdbId: 136315, title: 'The Bear', poster: null, action: 'started', note: 'S3E1', createdAt: new Date(Date.now() - 604800000).toISOString() },
]

export const MOCK_STATS = {
  moviesWatched: 247,
  showsTracked: 38,
  hoursWatched: 1840,
  avgRating: 8.4,
  ratedCount: 191,
  currentlyWatching: 10,
  monthlyData: [
    { month: 'Jan', count: 11 },
    { month: 'Feb', count: 17 },
    { month: 'Mar', count: 14 },
    { month: 'Apr', count: 20 },
    { month: 'May', count: 26 },
    { month: 'Jun', count: 23 },
    { month: 'Jul', count: 16 },
    { month: 'Aug', count: 13 },
  ],
  genres: [
    { name: 'Drama', percent: 32, color: '#f5a623' },
    { name: 'Sci-Fi', percent: 24, color: '#4a9eff' },
    { name: 'Thriller', percent: 18, color: '#b794f4' },
    { name: 'Crime', percent: 12, color: '#48bb78' },
    { name: 'Comedy', percent: 8, color: '#f6ad55' },
    { name: 'Other', percent: 6, color: '#718096' },
  ],
  ratingDistribution: [
    { rating: 10, count: 12 },
    { rating: 9, count: 28 },
    { rating: 8, count: 45 },
    { rating: 7, count: 38 },
    { rating: 6, count: 22 },
    { rating: 5, count: 10 },
  ],
  topDirectors: [
    { name: 'Christopher Nolan', films: 4, avgRating: 9.4 },
    { name: 'Damien Chazelle', films: 2, avgRating: 8.3 },
    { name: 'Denis Villeneuve', films: 2, avgRating: 8.7 },
    { name: 'Bong Joon-ho', films: 1, avgRating: 8.5 },
    { name: 'Yorgos Lanthimos', films: 1, avgRating: 8.0 },
  ],
}

// Watching progress (0-100) for series
export const SERIES_PROGRESS: Record<number, number> = {
  95396: 65,   // Severance
  100088: 40,  // The Last of Us
  94997: 80,   // House of the Dragon
  136315: 20,  // The Bear
}
