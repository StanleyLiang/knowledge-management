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
import {
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
} from './nodes/CollapsibleNodes'
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
]

export function Viewer({
  initialEditorState,
  theme,
}: ViewerProps) {
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

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="le-viewer-container">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="le-editor-content" />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <TablePlugin />
      </div>
    </LexicalComposer>
  )
}
