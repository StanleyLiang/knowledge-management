'use client'

import { useState } from 'react'
import { Editor } from '@lexical-editor/editor'
import type { SerializedEditorState } from 'lexical'

export default function EditorPage() {
  const [editorState, setEditorState] = useState<SerializedEditorState | null>(null)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Editor</h1>
      <Editor
        placeholder="Start writing..."
        onChange={setEditorState}
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
