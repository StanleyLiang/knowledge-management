'use client'

import { useState } from 'react'
import { Viewer } from '@lexical-editor/editor'

const SAMPLE_STATE = {
  root: {
    children: [
      {
        children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'Welcome to the Lexical Viewer', type: 'text', version: 1 }],
        direction: 'ltr', format: '', indent: 0, type: 'heading', version: 1, tag: 'h1',
      },
      {
        children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'This is a read-only view of the editor content. Below are examples of all supported node types.', type: 'text', version: 1 }],
        direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1,
      },
      {
        children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'Text Formatting', type: 'text', version: 1 }],
        direction: 'ltr', format: '', indent: 0, type: 'heading', version: 1, tag: 'h2',
      },
      {
        children: [
          { detail: 0, format: 1, mode: 'normal', style: '', text: 'Bold', type: 'text', version: 1 },
          { detail: 0, format: 0, mode: 'normal', style: '', text: ', ', type: 'text', version: 1 },
          { detail: 0, format: 2, mode: 'normal', style: '', text: 'Italic', type: 'text', version: 1 },
          { detail: 0, format: 0, mode: 'normal', style: '', text: ', ', type: 'text', version: 1 },
          { detail: 0, format: 8, mode: 'normal', style: '', text: 'Underline', type: 'text', version: 1 },
          { detail: 0, format: 0, mode: 'normal', style: '', text: ', ', type: 'text', version: 1 },
          { detail: 0, format: 4, mode: 'normal', style: '', text: 'Strikethrough', type: 'text', version: 1 },
          { detail: 0, format: 0, mode: 'normal', style: '', text: ', ', type: 'text', version: 1 },
          { detail: 0, format: 16, mode: 'normal', style: '', text: 'inline code', type: 'text', version: 1 },
        ],
        direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1,
      },
      {
        children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'Quote Block', type: 'text', version: 1 }],
        direction: 'ltr', format: '', indent: 0, type: 'heading', version: 1, tag: 'h2',
      },
      {
        children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'This is a quote block. It can contain multiple paragraphs of quoted text.', type: 'text', version: 1 }],
        direction: 'ltr', format: '', indent: 0, type: 'quote', version: 1,
      },
      {
        children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'Divider below:', type: 'text', version: 1 }],
        direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1,
      },
      { type: 'divider', version: 1 },
      {
        children: [{ detail: 0, format: 0, mode: 'normal', style: '', text: 'Content after divider.', type: 'text', version: 1 }],
        direction: 'ltr', format: '', indent: 0, type: 'paragraph', version: 1,
      },
    ],
    direction: 'ltr', format: '', indent: 0, type: 'root', version: 1,
  },
}

export default function ViewerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Viewer</h1>
      <div className="border border-gray-200 rounded-lg">
        <Viewer initialEditorState={JSON.stringify(SAMPLE_STATE)} />
      </div>
    </div>
  )
}
