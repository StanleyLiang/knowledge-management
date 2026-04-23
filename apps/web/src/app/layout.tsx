import type { Metadata } from 'next'
import Link from 'next/link'
import { Inter_Tight, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { BookOpen, Sparkles } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { SearchInput } from '@/components/layout/SearchInput'
import './globals.css'

const interTight = Inter_Tight({ subsets: ['latin'], variable: '--font-sans' })
const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
})
const jetMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Knowledge Base',
  description: 'Knowledge Base powered by Lexical Editor',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${interTight.variable} ${instrumentSerif.variable} ${jetMono.variable} min-h-screen bg-background text-foreground`}
      >
        <TooltipProvider delayDuration={300}>
          <nav className="bg-white border-b border-gray-200 px-6 py-3 sticky top-0 z-40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Link href="/spaces" className="flex items-center gap-2 font-bold text-lg">
                  <BookOpen className="h-5 w-5" />
                  Knowledge Base
                </Link>
                <Link
                  href="/syntheses"
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <Sparkles className="h-4 w-4" />
                  Syntheses
                </Link>
              </div>
              <SearchInput />
            </div>
          </nav>
          <div className="flex h-[calc(100vh-49px)]">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-5xl mx-auto py-8 px-6">{children}</div>
            </main>
          </div>
        </TooltipProvider>
      </body>
    </html>
  )
}
