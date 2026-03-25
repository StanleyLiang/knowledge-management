import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import type { EditorState, SerializedEditorState } from 'lexical'

interface OnChangePluginProps {
  onChange?: (editorState: SerializedEditorState) => void
}

export function OnChangePlugin({ onChange }: OnChangePluginProps) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!onChange) return

    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const serialized = editorState.toJSON()
        onChange(serialized)
      })
    })
  }, [editor, onChange])

  return null
}
