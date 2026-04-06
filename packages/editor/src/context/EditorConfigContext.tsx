import { createContext, useContext, type ReactNode } from 'react'
import type { DecorateUrl, OnDownload } from '../types'

export interface EditorConfig {
  decorateUrl?: DecorateUrl
  onDownload?: OnDownload
  pageSearch?: {
    onSearch: (query: string) => Promise<Array<{ id: string; title: string }>>
  }
}

const EditorConfigContext = createContext<EditorConfig>({})

export function EditorConfigProvider({
  config,
  children,
}: {
  config: EditorConfig
  children: ReactNode
}) {
  return (
    <EditorConfigContext.Provider value={config}>
      {children}
    </EditorConfigContext.Provider>
  )
}

export function useEditorConfig(): EditorConfig {
  return useContext(EditorConfigContext)
}
