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
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table'
import { TablePlugin as LexicalTablePlugin } from '@lexical/react/LexicalTablePlugin'

import { defaultTheme } from './themes/defaultTheme'
import { OnChangePlugin } from './plugins/OnChangePlugin'
import { CustomNodesPlugin } from './plugins/CustomNodesPlugin'
import { TablePlugin } from './plugins/TablePlugin'
import { SlashCommandPlugin } from './plugins/SlashCommandPlugin'
import { MarkdownPlugin } from './plugins/MarkdownPlugin'
import { FloatingLinkEditorPlugin } from './plugins/FloatingLinkEditorPlugin'
import { MentionPlugin } from './plugins/MentionPlugin'
import { EmojiPlugin } from './plugins/EmojiPlugin'
import { ImageUploadPlugin } from './plugins/ImageUploadPlugin'
import { DragDropPlugin } from './plugins/DragDropPlugin'
import { TableActionPlugin } from './plugins/TableActionPlugin'
import { TableOfContentsPlugin } from './plugins/TableOfContentsPlugin'
import { PageTags } from './components/editor/PageTags'
import { MentionNode } from './nodes/MentionNode'
import { MermaidNode } from './nodes/MermaidNode'
import { LandmarkNode } from './nodes/LandmarkNode'
import { Toolbar } from './components/editor/Toolbar'
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
  TableNode,
  TableCellNode,
  TableRowNode,
  CodeSnippetNode,
  MentionNode,
  MermaidNode,
  LandmarkNode,
]

export function Editor({
  initialEditorState,
  onChange,
  onUpload,
  onMentionSearch,
  theme,
  tags,
  placeholder = 'Start writing...',
  editable = true,
  showTableOfContents = false,
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
        <div className="le-editor-body">
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
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <CheckListPlugin />
        <LexicalTablePlugin hasHorizontalScroll />
        <TablePlugin />
        <TableActionPlugin />
        <CustomNodesPlugin />
        <ImageUploadPlugin onUpload={onUpload} />
        <SlashCommandPlugin />
        <MarkdownPlugin />
        <FloatingLinkEditorPlugin />
        <MentionPlugin onSearch={onMentionSearch} />
        <EmojiPlugin />
        <DragDropPlugin />
        <OnChangePlugin onChange={onChange} />
        {showTableOfContents && <TableOfContentsPlugin />}
        {tags && <PageTags value={tags.value} onChange={tags.onChange} suggestions={tags.suggestions} editable={editable} />}
      </div>
    </LexicalComposer>
  )
}
