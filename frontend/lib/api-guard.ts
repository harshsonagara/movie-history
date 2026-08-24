import { NextRequest } from 'next/server'

type RateLimitEntry = {
    count: number
    resetAt: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

type RateLimitOptions = {
    windowMs: number
    max: number
}

function getClientIp(req: NextRequest): string {
    const forwarded = req.headers.get('x-forwarded-for')
    if (forwarded) {
        return forwarded.split(',')[0]?.trim() || 'unknown'
    }
    return req.headers.get('x-real-ip') || 'unknown'
}

export function limitRequest(
    req: NextRequest,
    key: string,
    options: RateLimitOptions,
): Response | null {
    const now = Date.now()
    const bucketKey = `${key}:${getClientIp(req)}`
    const entry = rateLimitStore.get(bucketKey)

    if (!entry || now >= entry.resetAt) {
        rateLimitStore.set(bucketKey, { count: 1, resetAt: now + options.windowMs })
        return null
    }

    if (entry.count >= options.max) {
        const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000))
        return Response.json(
            {
                error: 'Too many requests. Please try again shortly.',
                retryAfterSeconds,
            },
            {
                status: 429,
                headers: { 'Retry-After': String(retryAfterSeconds) },
            },
        )
    }

    entry.count += 1
    return null
}

export async function parseJsonObjectBody(
    req: NextRequest,
): Promise<{ ok: true; body: Record<string, unknown> } | { ok: false; response: Response }> {
    const json = await req.json().catch(() => null)
    if (!json || typeof json !== 'object' || Array.isArray(json)) {
        return {
            ok: false,
            response: Response.json({ error: 'Invalid JSON body' }, { status: 400 }),
        }
    }
    return { ok: true, body: json as Record<string, unknown> }
}

export function asTrimmedString(value: unknown): string | null {
    if (typeof value !== 'string') return null
    const next = value.trim()
    return next ? next : null
}

export function asNumber(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
}

export function asInt(value: unknown): number | null {
    const n = asNumber(value)
    if (n === null) return null
    return Number.isInteger(n) ? n : null
}

export function asNullableNumber(value: unknown): number | null | undefined {
    if (value === undefined) return undefined
    return asNumber(value)
}

export function validateStatus(value: unknown, allowed: string[]): string | null {
    const status = asTrimmedString(value)
    if (!status) return null
    return allowed.includes(status) ? status : null
}

export function isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
