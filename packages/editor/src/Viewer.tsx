'use client'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode, AutoLinkNode } from '@lexical/link'

import { defaultTheme } from './themes/defaultTheme'
import type { ViewerProps } from './types'

const VIEWER_NODES = [
  HeadingNode,
  QuoteNode,
  ListNode,
  ListItemNode,
  LinkNode,
  AutoLinkNode,
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
      <div className="w-full bg-white">
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="le-editor-content" />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
    </LexicalComposer>
  )
}
