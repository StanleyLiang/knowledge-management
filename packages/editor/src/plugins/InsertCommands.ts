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
