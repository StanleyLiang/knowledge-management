# Knowledge Management — Lexical Editor Monorepo

A rich-text editor/viewer library built on [Lexical.js](https://lexical.dev), with a full-featured demo app, video conversion pipeline, and REST API backend.

## Repository Structure

```
.
├── packages/
│   └── editor/          # Core editor library (@lexical-editor/editor)
├── apps/
│   ├── demo/            # Next.js demo app — editor showcase
│   ├── web/             # Next.js web app — page/space management
│   └── api/             # Fastify REST API — Prisma + PostgreSQL
├── tools/
│   └── video-converter/ # MP4 → HLS conversion worker (NATS + MinIO)
└── prd.md               # Product Requirements Document
```

### `packages/editor`

The core library. Exports `<Editor>` (edit mode) and `<Viewer>` (read-only mode) React components.

**Key features:**
- 12+ custom node types: Image, Video (HLS), Attachment, Table, Code Snippet, Mermaid, Landmark, Bookmark, Mention, Collapsible, Divider
- Full toolbar: text formatting, colors, alignment, lists, indent, media insert
- Slash command (`/`) menu, `@mention`, `:emoji` typeahead
- Markdown shortcuts (`# heading`, `**bold**`, `` ```code `` `, etc.)
- Table: floating toolbar (row/column CRUD, merge/split, BG color, align, header toggle), column resize, drag reorder
- Code Snippet: Prism.js syntax highlighting, 14 languages, light theme
- Mermaid: fullscreen CodeMirror 6 editor with live preview
- Landmark: inline tag with portrait map modal (Taiwan county-level detail via `taiwan-atlas`, world map via `react-simple-maps` + Natural Earth admin-1)
- Video: file picker → MinIO upload → NATS → HLS conversion → hls.js playback
- Image: file picker → upload → resize handles → caption → lightbox viewer
- Drag & drop block reorder
- Plugin architecture with `plugins` config prop

**Tech stack:** Lexical.js 0.41, React 19, Tailwind CSS 4, shadcn/ui, Lucide icons, CodeMirror 6, hls.js, Prism.js, react-simple-maps, mermaid, framer-motion, i18next

### `apps/demo`

Next.js 15 demo app showcasing all editor features with pre-populated sample content.

- Video upload API route (`/api/upload`) — uploads to MinIO, publishes NATS conversion job
- Demonstrates `onUpload`, `videoConvert`, `plugins` configuration

### `apps/web`

Next.js 15 web application with space/page management.

- CRUD for spaces and pages
- Page editor with title, rich content, publish/unpublish, version history

### `apps/api`

Fastify 5 REST API with Prisma ORM.

- Spaces and Pages CRUD endpoints
- PostgreSQL database with migrations
- Publish history and version management

### `tools/video-converter`

NATS JetStream worker that converts MP4 to multi-bitrate HLS streams.

- Downloads from S3/MinIO, probes resolution, converts with FFmpeg
- Adaptive bitrate: 360p / 480p / 720p / 1080p (auto-filtered by source)
- Real-time status updates via NATS (`video.convert.status.<jobId>`)
- Docker Compose setup: NATS + MinIO + worker

---

## Getting Started

### Prerequisites

- Node.js >= 20
- npm (workspaces)
- Docker & Docker Compose (for video conversion)

### Install

```bash
npm install
```

### Development

```bash
# Start the demo app (editor showcase)
npm run dev

# Start the web app
npm run dev:web

# Start the API server (requires PostgreSQL)
npm run dev:api
```

The demo app runs at `http://localhost:3000`.

### Video Conversion (Optional)

```bash
# Start NATS + MinIO + video converter worker
cd tools/video-converter
docker compose up -d

# MinIO Console: http://localhost:9001 (minioadmin/minioadmin)
# NATS Monitor: http://localhost:8222
```

### Build

```bash
# Build all packages
npm run build

# Build editor library only
cd packages/editor && npm run build
```

---

## Editor Usage

```tsx
import { Editor, Viewer } from '@lexical-editor/editor'
import '@lexical-editor/editor/style.css'

// Edit mode
<Editor
  initialEditorState={state}
  onChange={setEditorState}
  placeholder="Start writing..."
  plugins={{
    upload: { onUpload: handleUpload },
    videoConvert: { natsWsUrl: 'ws://localhost:9222' },
    mention: { onSearch: searchUsers },
    tableOfContents: true,
  }}
/>

// Read-only mode
<Viewer initialEditorState={savedState} />
```

### Plugin Config

| Plugin | Config | Description |
|--------|--------|-------------|
| `upload` | `{ onUpload }` | File upload handler for image/video/attachment |
| `videoConvert` | `{ natsWsUrl, pollInterval }` | NATS WebSocket for HLS conversion tracking |
| `mention` | `{ onSearch, onHover }` | @mention user search |
| `tags` | `{ value, onChange, suggestions }` | Page tags |
| `tableOfContents` | `boolean` | Enable TOC sidebar |
| `colorPresets` | `string[]` | Custom color palette |
| `codeSnippet` | `{ languages }` | Code block language options |

---

## Architecture

```
Browser                    Next.js API           MinIO        NATS JetStream      Worker
  │                            │                   │               │                │
  │── POST /api/upload ───────>│── PUT object ────>│               │                │
  │                            │── publish job ──────────────────>│                │
  │<── { jobId, hlsUrl } ─────│                   │               │── consume ───>│
  │                                                │               │<── status ────│
  │<══ NATS WS (status) ══════════════════════════════════════════│                │
  │── GET master.m3u8 ────────────────────────────>│                                │
```

---

## License

Private — internal use only.
