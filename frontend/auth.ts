import type { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,
    session: { strategy: 'jwt' },
    pages: { signIn: '/login' },
    providers: [
        Credentials({
            name: 'credentials',
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                const email = typeof credentials?.email === 'string' ? credentials.email.trim().toLowerCase() : ''
                const password = typeof credentials?.password === 'string' ? credentials.password : ''
                if (!email || !password || !db) return null

                const user = await db.user.findUnique({ where: { email } })
                if (!user) return null

                const ok = await bcrypt.compare(password, user.passwordHash)
                if (!ok) return null

                return {
                    id: String(user.id),
                    email: user.email,
                    name: user.name ?? user.email.split('@')[0],
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user?.id) token.userId = user.id
            return token
        },
        async session({ session, token }) {
            if (session.user && token.userId) {
                session.user.id = String(token.userId)
            }
            return session
        },
    },
}