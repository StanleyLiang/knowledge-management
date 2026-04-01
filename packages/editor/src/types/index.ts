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

export interface EditorProps {
  initialEditorState?: SerializedEditorState | string
  onChange?: (editorState: SerializedEditorState) => void
  onUpload?: OnUpload
  decorateUrl?: DecorateUrl
  onDownload?: OnDownload
  onMentionSearch?: (query: string) => Promise<MentionSearchResult[]>
  onMentionHover?: (mentionId: string) => Promise<MentionSearchResult>
  onPageSearch?: (query: string) => Promise<Array<{ id: string; title: string }>>
  theme?: Partial<EditorThemeClasses>
  i18nResources?: Record<string, Record<string, string>>
  codeSnippet?: CodeSnippetConfig
  landmark?: LandmarkConfig
  tags?: TagsConfig
  colorPresets?: string[]
  editable?: boolean
  placeholder?: string
  showTableOfContents?: boolean
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
