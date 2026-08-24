'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff } from 'lucide-react'

export default function SignupPage() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password }),
        })

        if (!res.ok) {
            const data = await res.json().catch(() => ({})) as { error?: string }
            setError(data.error ?? 'Could not create account')
            setLoading(false)
            return
        }

        const login = await signIn('credentials', {
            email,
            password,
            redirect: false,
        })

        if (login?.error) {
            setError('Account created, but login failed. Please login manually.')
            setLoading(false)
            return
        }

        window.location.href = '/'
    }

    return (
        <div className="auth-page-wrap">
            <form className="card auth-card" onSubmit={onSubmit}>
                <h1 className="page-title">Sign Up</h1>
                <p className="page-sub">Create your personal tracker account</p>

                <div className="form-group">
                    <label>Name (optional)</label>
                    <input
                        className="form-input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                    />
                </div>

                <div className="form-group">
                    <label>Email</label>
                    <input
                        className="form-input"
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <div className="password-input-wrap">
                        <input
                            className="form-input password-input"
                            type={showPassword ? 'text' : 'password'}
                            minLength={6}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="password-eye-btn"
                            onClick={() => setShowPassword(v => !v)}
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            title={showPassword ? 'Hide password' : 'Show password'}
                        >
                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            <span>{showPassword ? 'Hide' : 'Show'}</span>
                        </button>
                    </div>
                </div>

                <button className="btn btn-gold w-full justify-center" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Account'}
                </button>

                {error && <div className="form-error">{error}</div>}

                <p className="auth-note">
                    Already have an account? <Link href="/login">Login</Link>
                </p>
            </form>
        </div>
    )
}
