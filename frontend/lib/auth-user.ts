import { getServerSession } from 'next-auth'
import { authOptions } from '@/auth'

export async function getCurrentUserId(): Promise<number | null> {
    const session = await getServerSession(authOptions)
    const raw = session?.user?.id
    if (!raw) return null
    const id = Number(raw)
    return Number.isFinite(id) ? id : null
}

export async function requireCurrentUserId(): Promise<number> {
    const id = await getCurrentUserId()
    if (!id) throw new Error('UNAUTHORIZED')
    return id
}
