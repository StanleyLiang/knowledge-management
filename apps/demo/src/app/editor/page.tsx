'use client'

import { useState, useCallback } from 'react'
import { Editor } from '@lexical-editor/editor'
import type { SerializedEditorState } from 'lexical'
import type { MediaUploadResult, MediaStatus, MediaType } from '@lexical-editor/editor'

// Helper to create a text node
const t = (text: string, format = 0, style = '') => ({
  detail: 0, format, mode: 'normal' as const, style, text, type: 'text' as const, version: 1,
})

// Helper to create a paragraph
const p = (children: unknown[], format = '', indent = 0) => ({
  children, direction: 'ltr' as const, format, indent, type: 'paragraph' as const, version: 1,
})

// Helper to create a heading
const h = (tag: string, children: unknown[]) => ({
  children, direction: 'ltr' as const, format: '', indent: 0, type: 'heading' as const, version: 1, tag,
})

// Helper to create a list item
const li = (children: unknown[], checked?: boolean) => ({
  children, direction: 'ltr' as const, format: '', indent: 0, type: 'listitem' as const, version: 1, value: 1,
  ...(checked !== undefined ? { checked } : {}),
})

const DEMO_STATE = {
  root: {
    children: [
      // ── H1: Title ──
      h('h1', [t('Lexical Editor — Feature Showcase')]),

      p([t('This document demonstrates every toolbar feature. Try editing!')]),

      // ── H2: Headings ──
      h('h2', [t('Headings')]),
      h('h3', [t('This is Heading 3')]),
      p([t('Normal paragraph text below headings.')]),

      // ── H2: Text Formatting ──
      h('h2', [t('Text Formatting')]),
      p([
        t('Bold', 1), t(', ', 0),
        t('Italic', 2), t(', ', 0),
        t('Bold+Italic', 3), t(', ', 0),
        t('Underline', 8), t(', ', 0),
        t('Strikethrough', 4), t(', ', 0),
        t('Inline Code', 16), t(', ', 0),
        t('Superscript', 32), t(', ', 0),
        t('Subscript', 64),
      ]),

      // ── H2: Text Color & Background ──
      h('h2', [t('Text Color & Background')]),
      p([
        t('Red text', 0, 'color: #FF0000'), t(' / ', 0),
        t('Blue text', 0, 'color: #0000FF'), t(' / ', 0),
        t('Green text', 0, 'color: #00FF00'), t(' / ', 0),
        t('Yellow highlight', 0, 'background-color: #FFFF00'), t(' / ', 0),
        t('Pink highlight', 0, 'background-color: #FF00FF; color: #FFFFFF'),
      ]),

      // ── H2: Text Alignment ──
      h('h2', [t('Text Alignment')]),
      p([t('Left aligned (default)')]),
      p([t('Center aligned')], 'center'),
      p([t('Right aligned')], 'right'),

      // ── H2: Lists ──
      h('h2', [t('Lists')]),
      p([t('Bulleted list:')]),
      {
        children: [
          li([t('First bullet item')]),
          li([t('Second bullet item')]),
          li([t('Third bullet item')]),
        ],
        direction: 'ltr', format: '', indent: 0, type: 'list', version: 1,
        listType: 'bullet', start: 1, tag: 'ul',
      },
      p([t('Numbered list:')]),
      {
        children: [
          li([t('Step one')]),
          li([t('Step two')]),
          li([t('Step three')]),
        ],
        direction: 'ltr', format: '', indent: 0, type: 'list', version: 1,
        listType: 'number', start: 1, tag: 'ol',
      },
      p([t('Action items (checklist):')]),
      {
        children: [
          li([t('Completed task')], true),
          li([t('Pending task')], false),
          li([t('Another pending task')], false),
        ],
        direction: 'ltr', format: '', indent: 0, type: 'list', version: 1,
        listType: 'check', start: 1, tag: 'ul',
      },

      // ── H2: Indent ──
      h('h2', [t('Indented Text')]),
      p([t('No indent (level 0)')]),
      p([t('Indent level 1')], '', 1),
      p([t('Indent level 2')], '', 2),

      // ── H2: Quote ──
      h('h2', [t('Quote Block')]),
      {
        children: [t('The best way to predict the future is to invent it. — Alan Kay')],
        direction: 'ltr', format: '', indent: 0, type: 'quote', version: 1,
      },

      // ── H2: Link ──
      h('h2', [t('Link')]),
      p([
        t('Visit '),
        {
          children: [t('Lexical.dev')],
          direction: 'ltr', format: '', indent: 0, type: 'link', version: 1,
          rel: 'noopener', target: '_blank', title: '', url: 'https://lexical.dev',
        },
        t(' for documentation.'),
      ]),

      // ── H2: Divider ──
      h('h2', [t('Divider')]),
      p([t('Content above the divider.')]),
      { type: 'divider', version: 1 },
      p([t('Content below the divider.')]),

      // ── H2: Collapsible ──
      h('h2', [t('Collapsible Container')]),
      {
        type: 'collapsible-container', version: 1, open: true,
        children: [
          {
            type: 'collapsible-title', version: 1, direction: 'ltr', format: '', indent: 0,
            children: [t('Click to toggle this section')],
          },
          {
            type: 'collapsible-content', version: 1, direction: 'ltr', format: '', indent: 0,
            children: [p([t('This content is inside a collapsible container. It can be expanded or collapsed.')])],
          },
        ],
        direction: 'ltr', format: '', indent: 0,
      },

      // ── H2: Image ──
      h('h2', [t('Image')]),
      {
        type: 'image', version: 1,
        src: 'https://placehold.co/600x300/e2e8f0/64748b?text=Sample+Image',
        altText: 'Sample placeholder image', width: 600, height: 300,
        alignment: 'center', showCaption: false, caption: '',
      },

      // ── H2: Video (HLS) ──
      h('h2', [t('Video (HLS Playback)')]),
      {
        type: 'video', version: 1,
        src: 'http://localhost:9000/videos/hls/d2bb1a45-1f7f-459b-9bbf-215c1e2e1e0b/master.m3u8',
        width: 640, height: 360, format: 'hls',
      },

      // ── H2: Attachment ──
      h('h2', [t('Attachment')]),
      {
        type: 'attachment', version: 1,
        url: '#', fileName: 'project-report.pdf',
        fileSize: 2457600, mimeType: 'application/pdf',
      },

      // ── H2: Table ──
      h('h2', [t('Table')]),
      {
        type: 'table', version: 1, direction: 'ltr', format: '', indent: 0,
        children: [
          {
            type: 'tablerow', version: 1, direction: 'ltr', format: '', indent: 0,
            children: [
              { type: 'tablecell', version: 1, direction: 'ltr', format: '', indent: 0, headerState: 1, colSpan: 1, rowSpan: 1, backgroundColor: null, children: [p([t('Feature', 1)])] },
              { type: 'tablecell', version: 1, direction: 'ltr', format: '', indent: 0, headerState: 1, colSpan: 1, rowSpan: 1, backgroundColor: null, children: [p([t('Status', 1)])] },
              { type: 'tablecell', version: 1, direction: 'ltr', format: '', indent: 0, headerState: 1, colSpan: 1, rowSpan: 1, backgroundColor: null, children: [p([t('Notes', 1)])] },
            ],
          },
          {
            type: 'tablerow', version: 1, direction: 'ltr', format: '', indent: 0,
            children: [
              { type: 'tablecell', version: 1, direction: 'ltr', format: '', indent: 0, headerState: 0, colSpan: 1, rowSpan: 1, backgroundColor: null, children: [p([t('Rich Text')])] },
              { type: 'tablecell', version: 1, direction: 'ltr', format: '', indent: 0, headerState: 0, colSpan: 1, rowSpan: 1, backgroundColor: null, children: [p([t('✅ Done')])] },
              { type: 'tablecell', version: 1, direction: 'ltr', format: '', indent: 0, headerState: 0, colSpan: 1, rowSpan: 1, backgroundColor: null, children: [p([t('All formats supported')])] },
            ],
          },
          {
            type: 'tablerow', version: 1, direction: 'ltr', format: '', indent: 0,
            children: [
              { type: 'tablecell', version: 1, direction: 'ltr', format: '', indent: 0, headerState: 0, colSpan: 1, rowSpan: 1, backgroundColor: null, children: [p([t('Custom Nodes')])] },
              { type: 'tablecell', version: 1, direction: 'ltr', format: '', indent: 0, headerState: 0, colSpan: 1, rowSpan: 1, backgroundColor: null, children: [p([t('✅ Done')])] },
              { type: 'tablecell', version: 1, direction: 'ltr', format: '', indent: 0, headerState: 0, colSpan: 1, rowSpan: 1, backgroundColor: null, children: [p([t('12 node types')])] },
            ],
          },
        ],
      },

      // ── H2: Code Snippet ──
      h('h2', [t('Code Snippet')]),
      {
        type: 'code-snippet', version: 1,
        code: 'function greet(name: string): string {\n  return `Hello, ${name}!`;\n}\n\nconsole.log(greet("World"));',
        language: 'typescript',
      },

      // ── H2: Mermaid ──
      h('h2', [t('Mermaid Diagram')]),
      {
        type: 'mermaid', version: 1,
        source: 'graph LR\n    A[Editor] --> B[Serialization]\n    B --> C[JSON State]\n    C --> D[Viewer]\n    A --> E[Toolbar]\n    E --> F[Formatting]',
        width: 600, height: 300,
      },

      // ── H2: Bookmark ──
      h('h2', [t('Bookmark')]),
      {
        type: 'bookmark', version: 1,
        title: 'Lexical — An extensible text editor framework',
        url: 'https://lexical.dev',
      },

      // ── H2: Mention ──
      h('h2', [t('Mention')]),
      p([
        t('This feature was implemented by '),
        { type: 'mention', version: 1, mentionId: '1', mentionName: 'Alice Chen' },
        t(' and reviewed by '),
        { type: 'mention', version: 1, mentionId: '2', mentionName: 'Bob Wang' },
        t('.'),
      ]),

      // ── H2: Landmark ──
      h('h2', [t('Landmarks')]),
      p([
        t('Key locations: '),
        { type: 'landmark', version: 1, name: 'Taipei 101', latitude: 25.0339, longitude: 121.5645 },
        t(' '),
        { type: 'landmark', version: 1, name: 'Tokyo Tower', latitude: 35.6586, longitude: 139.7454 },
        t(' '),
        { type: 'landmark', version: 1, name: 'Eiffel Tower', latitude: 48.8584, longitude: 2.2945 },
      ]),

      // ── Footer ──
      { type: 'divider', version: 1 },
      p([t('End of feature showcase. Try the ', 0), t('/ slash command', 16), t(', ', 0), t('@mention', 16), t(', and ', 0), t(':emoji', 16), t(' features by typing in the editor!', 0)]),
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1,
  },
}

export default function EditorPage() {
  const [editorState, setEditorState] = useState<SerializedEditorState | null>(null)

  const handleUpload = useCallback(
    async (
      file: File,
      type: MediaType,
      onStatusChange: (status: MediaStatus) => void,
    ): Promise<MediaUploadResult> => {
      if (type === 'video') {
        // 1. Upload to MinIO via API route
        onStatusChange('uploading')
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Upload failed' }))
          throw new Error(err.error || 'Upload failed')
        }

        const { jobId, hlsUrl } = await res.json()
        console.log('[video-upload] Job created:', jobId, 'HLS URL:', hlsUrl)

        // 2. Return immediately — VideoConvertPlugin handles the rest
        //    Plugin subscribes to NATS WS + polls for completion
        return { url: hlsUrl, format: 'hls', jobId }
      }

      if (type === 'image') {
        // Upload image to MinIO via API route
        onStatusChange('uploading')
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Upload failed' }))
          throw new Error(err.error || 'Upload failed')
        }

        const { src } = await res.json()
        return { url: src }
      }

      // attachment: upload to MinIO
      onStatusChange('uploading')
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || 'Upload failed')
      }

      const { src, fileName, fileSize, mimeType } = await res.json()
      return { url: src, fileName, fileSize, mimeType }
    },
    [],
  )

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Editor</h1>
      <Editor
        initialEditorState={JSON.stringify(DEMO_STATE)}
        placeholder="Start writing..."
        onChange={setEditorState}
        plugins={{
          upload: { onUpload: handleUpload },
          videoConvert: {
            natsWsUrl: process.env.NEXT_PUBLIC_NATS_WS_URL || 'ws://localhost:9222',
            statusSubjectPrefix: process.env.NEXT_PUBLIC_NATS_STATUS_PREFIX || 'video.convert.status',
            pollInterval: Number(process.env.NEXT_PUBLIC_VIDEO_CONVERT_POLL_INTERVAL) || 3000,
          },
        }}
      />

      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-gray-500 font-mono">
          Serialized Editor State (JSON)
        </summary>
        <pre className="mt-2 p-4 bg-gray-900 text-green-400 text-xs rounded-lg overflow-auto max-h-96">
          {editorState ? JSON.stringify(editorState, null, 2) : 'No content yet'}
        </pre>
      </details>
    </div>
  )
}
