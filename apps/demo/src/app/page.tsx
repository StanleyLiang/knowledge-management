export default function Home() {
  return (
    <div className="text-center py-20">
      <h1 className="text-3xl font-bold mb-4">Lexical Editor Demo</h1>
      <p className="text-gray-600 mb-8">
        Choose a mode to get started.
      </p>
      <div className="flex gap-4 justify-center">
        <a
          href="/editor"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          Editor Mode
        </a>
        <a
          href="/viewer"
          className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Viewer Mode
        </a>
      </div>
    </div>
  )
}
