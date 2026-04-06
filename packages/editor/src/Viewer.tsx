'use client'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { TablePlugin } from '@lexical/react/LexicalTablePlugin'

import { defaultTheme } from './themes/defaultTheme'
import { DividerNode } from './nodes/DividerNode'
import { BookmarkNode } from './nodes/BookmarkNode'
import { ImageNode } from './nodes/ImageNode'
import { VideoNode } from './nodes/VideoNode'
import { AttachmentNode } from './nodes/AttachmentNode'
import { CodeSnippetNode } from './nodes/CodeSnippetNode'
import { MentionNode } from './nodes/MentionNode'
import { MermaidNode } from './nodes/MermaidNode'
import { LandmarkNode } from './nodes/LandmarkNode'
import {
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
} from './nodes/CollapsibleNodes'
import { TocSidebar } from './components/TocSidebar'
import { CollapsibleHeadingPlugin } from './plugins/CollapsibleHeadingPlugin'
import { EditorConfigProvider } from './context/EditorConfigContext'
import { initI18n } from './i18n'
import { PresentationMode, PresentationButton } from './components/viewer/PresentationMode'
import { useState } from 'react'
import type { ViewerProps } from './types'

const VIEWER_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
  DividerNode,
  BookmarkNode,
  ImageNode,
  VideoNode,
  AttachmentNode,
  CodeSnippetNode,
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  MentionNode,
  MermaidNode,
  LandmarkNode,
]

export function Viewer({
  title,
  initialEditorState,
  decorateUrl,
  onDownload,
  theme,
  i18nResources,
  showTableOfContents = false,
  showPresentationButton = false,
}: ViewerProps) {
  initI18n(i18nResources)
  const [showPresentation, setShowPresentation] = useState(false)
  const initialConfig = {
    namespace: 'LexicalViewer',
    theme: { ...defaultTheme, ...theme },
    nodes: VIEWER_NODES,
    editable: false,
    onError: (error: Error) => {
      console.error('[LexicalViewer]', error)
    },
    editorState:
      typeof initialEditorState === 'string'
        ? initialEditorState
        : JSON.stringify(initialEditorState),
  }

  const editorConfig = { decorateUrl, onDownload }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorConfigProvider config={editorConfig}>
        <div className={`le-editor-wrapper ${showTableOfContents ? 'le-editor-wrapper-with-toc' : ''}`}>
          <div className="le-viewer-container">
            {title && <h1 className="le-viewer-title">{title}</h1>}
            <RichTextPlugin
              contentEditable={
                <ContentEditable className="le-editor-content" />
              }
              placeholder={null}
              ErrorBoundary={LexicalErrorBoundary}
            />
            <TablePlugin />
            <CollapsibleHeadingPlugin />
          </div>
          {showTableOfContents && <TocSidebar />}
        </div>
        {showPresentationButton && (
          <PresentationButton onClick={() => setShowPresentation(true)} />
        )}
        {showPresentation && (
          <PresentationMode
            initialEditorState={initialEditorState}
            onClose={() => setShowPresentation(false)}
            theme={theme}
          />
        )}
      </EditorConfigProvider>
    </LexicalComposer>
  )
}
