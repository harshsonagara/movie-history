export type ToastType = 'success' | 'error'

export function showToast(msg: string, type: ToastType = 'success') {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('cinelog-toast', { detail: { msg, type } }))
}
