import type { Metadata } from 'next'
import { Inter_Tight, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { CommandPalette } from '@/components/CommandPalette'
import './globals.css'

const interTight = Inter_Tight({ subsets: ['latin'], variable: '--font-sans' })
const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-serif',
})
const jetMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Keeptio',
  description: 'Keeptio — kept within reach',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${interTight.variable} ${instrumentSerif.variable} ${jetMono.variable} min-h-screen bg-background text-foreground`}
      >
        <TooltipProvider delayDuration={300}>
          <div className="flex h-screen">
            <AppSidebar />
            <main className="flex-1 overflow-y-auto">
              <div className="max-w-5xl mx-auto py-8 px-6">{children}</div>
            </main>
          </div>
          <CommandPalette />
        </TooltipProvider>
      </body>
    </html>
  )
}
