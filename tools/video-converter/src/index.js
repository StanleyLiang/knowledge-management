// Video converter dev tool - placeholder
// Prerequisite: brew install ffmpeg
// Usage: npm run dev (from tools/video-converter)

import express from 'express'

const app = express()
const PORT = 3001

app.post('/convert', (_req, res) => {
  res.json({ message: 'Video converter not yet implemented' })
})

app.listen(PORT, () => {
  console.log(`Video converter running on http://localhost:${PORT}`)
})
