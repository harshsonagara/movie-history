'use client'

import { useState } from 'react'

const TMDB_IMG = 'https://image.tmdb.org/t/p/w500'

export function Poster({
  poster,
  title,
  imgClassName = 'movie-poster',
  placeholderClassName = 'movie-poster-placeholder',
}: {
  poster?: string | null
  title: string
  imgClassName?: string
  placeholderClassName?: string
}) {
  const [failed, setFailed] = useState(false)

  if (!poster || failed) {
    return <div className={placeholderClassName}>{title[0]}</div>
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${TMDB_IMG}${poster}`}
      alt={title}
      className={imgClassName}
      onError={() => setFailed(true)}
    />
  )
}
