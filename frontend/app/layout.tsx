import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import AuthProvider from '@/components/AuthProvider'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'CineLog',
  description: 'Personal movie & TV tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="app-shell">
        <AuthProvider>
          <Sidebar />
          <main className="main-content">{children}</main>
        </AuthProvider>
      </body>
    </html>
  )
}
