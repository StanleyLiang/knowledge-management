import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Lexical Editor Demo',
  description: 'Demo app for Lexical Editor/Viewer Library',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center gap-6">
            <span className="font-bold text-lg">Lexical Editor Demo</span>
            <a href="/editor" className="text-blue-600 hover:underline">
              Editor
            </a>
            <a href="/viewer" className="text-blue-600 hover:underline">
              Viewer
            </a>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto py-8 px-6">{children}</main>
      </body>
    </html>
  )
}
