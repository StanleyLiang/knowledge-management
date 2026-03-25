import mitt from 'mitt'

export type EditorEvents = {
  'editor:change': { editorState: string }
  'editor:focus': void
  'editor:blur': void
}

export const editorEventBus = mitt<EditorEvents>()
