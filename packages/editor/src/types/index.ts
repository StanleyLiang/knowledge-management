import type { SerializedEditorState, EditorThemeClasses } from 'lexical'

export interface MediaUploadResult {
  url: string
  width?: number
  height?: number
  fileName?: string
  fileSize?: number
  mimeType?: string
  format?: 'mp4' | 'hls'
  jobId?: string
}

export type MediaType = 'image' | 'video' | 'attachment'
export type MediaStatus = 'uploading' | 'converting'

export type OnUpload = (
  file: File,
  type: MediaType,
  onStatusChange: (status: MediaStatus) => void,
) => Promise<MediaUploadResult>

export type DecorateUrl = (
  url: string,
  type: MediaType,
) => string | Promise<string>

export type OnDownload = (attachment: {
  url: string
  fileName?: string
  fileSize?: number
  mimeType?: string
}) => void | Promise<void>

export interface MentionSearchResult {
  id: string
  name: string
  avatar?: string
  department?: string
  email?: string
}

export interface LandmarkItem {
  id: string
  name: string
  latitude: number
  longitude: number
}

export interface CodeSnippetConfig {
  languages?: Array<{ id: string; label: string }>
  registerLanguages?: Array<{
    id: string
    label: string
    definition: unknown
  }>
  defaultLanguage?: string
  showLineNumbers?: boolean
}

export interface TagsConfig {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
}

export interface LandmarkConfig {
  items: LandmarkItem[]
  displayMode?: 'map' | 'text'
}

export interface VideoConvertConfig {
  /** NATS WebSocket URL for subscribing to conversion status */
  natsWsUrl: string
  /** Subject prefix for status updates (default: 'video.convert.status') */
  statusSubjectPrefix?: string
  /** Fallback polling interval in ms (default: 3000). Set 0 to disable. */
  pollInterval?: number
}

export interface PluginConfig {
  upload?: { onUpload: OnUpload }
  download?: { onDownload: OnDownload }
  decorateUrl?: DecorateUrl
  videoConvert?: VideoConvertConfig
  mention?: {
    onSearch: (query: string) => Promise<MentionSearchResult[]>
    onHover?: (mentionId: string) => Promise<MentionSearchResult>
  }
  pageSearch?: {
    onSearch: (query: string) => Promise<Array<{ id: string; title: string }>>
  }
  codeSnippet?: CodeSnippetConfig
  landmark?: LandmarkConfig
  tags?: TagsConfig
  tableOfContents?: boolean
  colorPresets?: string[]
}

export interface EditorProps {
  initialEditorState?: SerializedEditorState | string
  onChange?: (editorState: SerializedEditorState) => void
  theme?: Partial<EditorThemeClasses>
  i18nResources?: Record<string, Record<string, string>>
  editable?: boolean
  placeholder?: string
  plugins?: PluginConfig
}

export interface ViewerProps {
  initialEditorState: SerializedEditorState | string
  decorateUrl?: DecorateUrl
  onDownload?: OnDownload
  onMentionHover?: (mentionId: string) => Promise<MentionSearchResult>
  onBookmarkClick?: (url: string) => void
  theme?: Partial<EditorThemeClasses>
  i18nResources?: Record<string, Record<string, string>>
  codeSnippet?: CodeSnippetConfig
  landmark?: LandmarkConfig
  tags?: string[]
  showTableOfContents?: boolean
  showPresentationButton?: boolean
}
