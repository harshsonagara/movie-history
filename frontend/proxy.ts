import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export default async function proxy(req: NextRequest) {
    const path = req.nextUrl.pathname
    const isAuthPage = path.startsWith('/login') || path.startsWith('/signup')
    const isAuthApi = path.startsWith('/api/auth')
    const isPublicAsset = path.startsWith('/_next') || path === '/favicon.ico'

    if (isPublicAsset) return NextResponse.next()

    const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET
    const token = await getToken({ req, secret })
    const isLoggedIn = !!token

    if (isAuthPage && isLoggedIn) {
        return NextResponse.redirect(new URL('/', req.url))
    }

    if (!isLoggedIn && !isAuthPage && !isAuthApi) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
