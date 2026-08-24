'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    async function onSubmit(e: FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        const result = await signIn('credentials', {
            email,
            password,
            redirect: false,
        })

        if (result?.error) {
            setError('Invalid email or password')
            setLoading(false)
            return
        }

        window.location.href = '/'
    }

    return (
        <div className="auth-page-wrap">
            <form className="card auth-card" onSubmit={onSubmit}>
                <h1 className="page-title">Login</h1>
                <p className="page-sub">Sign in to your movie tracker</p>

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
                    {loading ? 'Signing in...' : 'Login'}
                </button>

                {error && <div className="form-error">{error}</div>}

                <p className="auth-note">
                    No account? <Link href="/signup">Create one</Link>
                </p>
            </form>
        </div>
    )
}
