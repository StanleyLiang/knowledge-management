import type { Metadata } from 'next'
import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { SearchInput } from '@/components/layout/SearchInput'
import './globals.css'

export const metadata: Metadata = {
  title: 'Knowledge Base',
  description: 'Knowledge Base powered by Lexical Editor',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <Link href="/spaces" className="flex items-center gap-2 font-bold text-lg">
              <BookOpen className="h-5 w-5" />
              Knowledge Base
            </Link>
            <SearchInput />
          </div>
        </nav>
        <div className="flex h-[calc(100vh-49px)]">
          <AppSidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto py-8 px-6">{children}</div>
          </main>
        </div>
      </body>
    </html>
  )
}
