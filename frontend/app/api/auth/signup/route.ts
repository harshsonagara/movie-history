import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
    if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

    const body = await req.json().catch(() => null) as { email?: string; password?: string; name?: string } | null
    const email = body?.email?.trim().toLowerCase() ?? ''
    const password = body?.password ?? ''
    const name = body?.name?.trim() || null

    if (!email || !password) {
        return Response.json({ error: 'Email and password are required' }, { status: 400 })
    }
    if (password.length < 6) {
        return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const exists = await db.user.findUnique({ where: { email } })
    if (exists) {
        return Response.json({ error: 'Email already in use' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await db.user.create({ data: { email, name, passwordHash } })

    return Response.json({ id: user.id, email: user.email, name: user.name }, { status: 201 })
}
