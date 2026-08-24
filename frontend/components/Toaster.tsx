'use client'
import { useState, useEffect } from 'react'

type Toast = { id: number; msg: string; type: 'success' | 'error' }

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const { msg, type } = (e as CustomEvent<{ msg: string; type: 'success' | 'error' }>).detail
      const id = Date.now()
      setToasts(prev => [...prev, { id, msg, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
    }
    window.addEventListener('cinelog-toast', handler)
    return () => window.removeEventListener('cinelog-toast', handler)
  }, [])

  if (!toasts.length) return null
  return (
    <div className="toaster">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
      ))}
    </div>
  )
}
