'use client'

import { LexicalComposer } from '@lexical/react/LexicalComposer'
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin'
import { ContentEditable } from '@lexical/react/LexicalContentEditable'
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin'
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary'
import { HeadingNode, QuoteNode } from '@lexical/rich-text'
import { ListNode, ListItemNode } from '@lexical/list'
import { LinkNode, AutoLinkNode } from '@lexical/link'
import { ListPlugin } from '@lexical/react/LexicalListPlugin'
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin'
import { CheckListPlugin } from '@lexical/react/LexicalCheckListPlugin'

import { defaultTheme } from './themes/defaultTheme'
import { OnChangePlugin } from './plugins/OnChangePlugin'
import { CustomNodesPlugin } from './plugins/CustomNodesPlugin'
import { Toolbar } from './components/editor/Toolbar'
import { DividerNode } from './nodes/DividerNode'
import { BookmarkNode } from './nodes/BookmarkNode'
import { ImageNode } from './nodes/ImageNode'
import { VideoNode } from './nodes/VideoNode'
import { AttachmentNode } from './nodes/AttachmentNode'
import {
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
} from './nodes/CollapsibleNodes'
import type { EditorProps } from './types'

const EDITOR_NODES = [
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
  CollapsibleContainerNode,
  CollapsibleTitleNode,
  CollapsibleContentNode,
]

export function Editor({
  initialEditorState,
  onChange,
  theme,
  placeholder = 'Start writing...',
  editable = true,
}: EditorProps) {
  const initialConfig = {
    namespace: 'LexicalEditor',
    theme: { ...defaultTheme, ...theme },
    nodes: EDITOR_NODES,
    editable,
    onError: (error: Error) => {
      console.error('[LexicalEditor]', error)
    },
    ...(initialEditorState
      ? {
          editorState:
            typeof initialEditorState === 'string'
              ? initialEditorState
              : JSON.stringify(initialEditorState),
        }
      : {}),
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="le-editor-container">
        <Toolbar />
        <RichTextPlugin
          contentEditable={
            <ContentEditable className="le-editor-content" />
          }
          placeholder={
            <div className="le-editor-placeholder">
              {placeholder}
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <CheckListPlugin />
        <CustomNodesPlugin />
        <OnChangePlugin onChange={onChange} />
      </div>
    </LexicalComposer>
  )
}
