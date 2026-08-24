import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { asTrimmedString, isValidEmail, limitRequest, parseJsonObjectBody } from '@/lib/api-guard'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
    const rateLimited = limitRequest(req, 'signup', { windowMs: 60_000, max: 8 })
    if (rateLimited) return rateLimited

    if (!db) return Response.json({ error: 'Database unavailable' }, { status: 503 })

    const parsed = await parseJsonObjectBody(req)
    if (!parsed.ok) return parsed.response
    const body = parsed.body

    const emailValue = asTrimmedString(body.email)
    const email = emailValue ? emailValue.toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const name = asTrimmedString(body.name)

    if (!email || !password) {
        return Response.json({ error: 'Email and password are required' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
        return Response.json({ error: 'Invalid email format' }, { status: 400 })
    }
    if (password.length < 6) {
        return Response.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    try {
        const exists = await db.user.findUnique({ where: { email } })
        if (exists) {
            return Response.json({ error: 'Email already in use' }, { status: 409 })
        }

        const passwordHash = await bcrypt.hash(password, 10)
        const user = await db.user.create({ data: { email, name, passwordHash } })

        return Response.json({ id: user.id, email: user.email, name: user.name }, { status: 201 })
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return Response.json({ error: 'Email already in use' }, { status: 409 })
            }
            if (error.code === 'P2021') {
                return Response.json({ error: 'Database schema is out of date. Run migrations.' }, { status: 503 })
            }
            if (error.code === 'P1001' || error.code === 'P1002') {
                return Response.json({ error: 'Database connection failed. Check DATABASE_URL and SSL settings.' }, { status: 503 })
            }
        }
        if (error instanceof Prisma.PrismaClientInitializationError) {
            return Response.json({ error: 'Database initialization failed. Check DATABASE_URL and SSL settings.' }, { status: 503 })
        }
        if (error instanceof Error) {
            const msg = error.message.toLowerCase()
            if (msg.includes('relation') && msg.includes('does not exist')) {
                return Response.json({ error: 'Database schema is out of date. Run migrations.' }, { status: 503 })
            }
            if (msg.includes('connect') || msg.includes('timeout') || msg.includes('ssl') || msg.includes('certificate')) {
                return Response.json({ error: 'Database connection failed. Check DATABASE_URL and SSL settings.' }, { status: 503 })
            }
        }
        console.error('Signup failed', error)
        return Response.json({ error: 'Unable to create account right now' }, { status: 500 })
    }
}
