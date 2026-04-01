import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import './globals.css'

export const metadata: Metadata = {
  title: 'Knowledge Base',
  description: 'Knowledge Base powered by Lexical Editor',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-4">
            <Link href="/spaces" className="flex items-center gap-2 font-bold text-lg">
              <BookOpen className="h-5 w-5" />
              Knowledge Base
            </Link>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto py-8 px-6">{children}</main>
      </body>
    </html>
  )
}
