import { createCommand, type LexicalCommand } from 'lexical'

export const INSERT_DIVIDER_COMMAND: LexicalCommand<void> = createCommand('INSERT_DIVIDER_COMMAND')

export const INSERT_BOOKMARK_COMMAND: LexicalCommand<{ title: string; url: string }> =
  createCommand('INSERT_BOOKMARK_COMMAND')

export const INSERT_COLLAPSIBLE_COMMAND: LexicalCommand<void> =
  createCommand('INSERT_COLLAPSIBLE_COMMAND')

export const INSERT_IMAGE_COMMAND: LexicalCommand<{
  src: string; altText?: string; width?: number; height?: number
}> = createCommand('INSERT_IMAGE_COMMAND')

export const INSERT_VIDEO_COMMAND: LexicalCommand<{
  src: string; width?: number; height?: number; format?: 'mp4' | 'hls'
}> = createCommand('INSERT_VIDEO_COMMAND')

export const INSERT_ATTACHMENT_COMMAND: LexicalCommand<{
  url: string; fileName?: string; fileSize?: number; mimeType?: string
}> = createCommand('INSERT_ATTACHMENT_COMMAND')

export const INSERT_TABLE_COMMAND: LexicalCommand<{
  rows: number; columns: number
}> = createCommand('INSERT_TABLE_COMMAND')

export const INSERT_CODE_SNIPPET_COMMAND: LexicalCommand<{
  code?: string; language?: string
}> = createCommand('INSERT_CODE_SNIPPET_COMMAND')

export const INSERT_MERMAID_COMMAND: LexicalCommand<{
  source?: string
}> = createCommand('INSERT_MERMAID_COMMAND')

export const INSERT_LANDMARK_COMMAND: LexicalCommand<{
  items?: Array<{ id: string; name: string; latitude: number; longitude: number }>
}> = createCommand('INSERT_LANDMARK_COMMAND')
