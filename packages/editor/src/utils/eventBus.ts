import mitt from 'mitt'

export type EditorEvents = {
  'editor:change': { editorState: string }
  'editor:focus': void
  'editor:blur': void
  'trigger:image-upload': void
  'trigger:video-upload': void
  'trigger:attachment-upload': void
}

export const editorEventBus = mitt<EditorEvents>()
