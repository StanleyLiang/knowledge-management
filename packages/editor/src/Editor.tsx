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
import { VideoUploadPlugin } from './plugins/VideoUploadPlugin'
import { AttachmentUploadPlugin } from './plugins/AttachmentUploadPlugin'
import { VideoConvertPlugin } from './plugins/VideoConvertPlugin'
import { TableActionToolbar } from './components/editor/TableActionToolbar'
import { TableColumnResizePlugin } from './plugins/TableColumnResizePlugin'
import { TableDragReorderPlugin } from './plugins/TableDragReorderPlugin'
import { SlashCommandPlugin } from './plugins/SlashCommandPlugin'
import { MarkdownPlugin } from './plugins/MarkdownPlugin'
import { FloatingLinkEditorPlugin } from './plugins/FloatingLinkEditorPlugin'
import { MentionPlugin } from './plugins/MentionPlugin'
import { EmojiPlugin } from './plugins/EmojiPlugin'
import { ImageUploadPlugin } from './plugins/ImageUploadPlugin'
import { DragDropPlugin } from './plugins/DragDropPlugin'
import { PastePlugin } from './plugins/PastePlugin'
import { CollapsibleHeadingPlugin } from './plugins/CollapsibleHeadingPlugin'
import { TableActionPlugin } from './plugins/TableActionPlugin'
import { TableFreezeColumnPlugin } from './plugins/TableFreezeColumnPlugin'
import { TableStickyHeaderPlugin } from './plugins/TableStickyHeaderPlugin'
import { TableSortFilterPlugin } from './plugins/TableSortFilterPlugin'
import { SelectionActionMenuPlugin, type SelectionAction } from './plugins/SelectionActionMenuPlugin'
import { TextToMermaidPlugin } from './plugins/TextToMermaidPlugin'
import { GENERATE_MERMAID_COMMAND } from './plugins/InsertCommands'
import { GitBranch } from 'lucide-react'
import { TocSidebar } from './components/TocSidebar'
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
import { Toaster } from './components/ui/toast'
import { EditorConfigProvider } from './context/EditorConfigContext'
import { initI18n } from './i18n'
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
  theme,
  i18nResources,
  editable = true,
  placeholder = 'Start writing...',
  plugins = {},
  title,
  onTitleChange,
  titlePlaceholder,
}: EditorProps) {
  initI18n(i18nResources)
  const {
    upload,
    download,
    decorateUrl,
    videoConvert,
    mention,
    pageSearch,
    tags,
    tableOfContents,
    mermaid,
  } = plugins

  const selectionActions: SelectionAction[] = []
  if (mermaid?.onGenerate) {
    selectionActions.push({
      key: 'to-mermaid',
      label: 'Generate Diagram',
      icon: GitBranch,
      onAction: (text, anchorBlockKey, ed) => {
        ed.dispatchCommand(GENERATE_MERMAID_COMMAND, { text, anchorBlockKey })
      },
    })
  }
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

  const editorConfig = { decorateUrl, onDownload: download?.onDownload, pageSearch }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <EditorConfigProvider config={editorConfig}>
        <div className={`le-editor-wrapper ${tableOfContents ? 'le-editor-wrapper-with-toc' : ''}`}>
        <div className="le-editor-container">
          {onTitleChange !== undefined && (
            <input
              className="le-editor-title"
              value={title ?? ''}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder={titlePlaceholder ?? 'Untitled'}
            />
          )}
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
        <TableActionToolbar />
        <TableColumnResizePlugin />
        <TableDragReorderPlugin />
        <TableActionPlugin />
        <TableFreezeColumnPlugin />
        <TableStickyHeaderPlugin />
        <TableSortFilterPlugin />
        <CustomNodesPlugin />
        <ImageUploadPlugin onUpload={upload?.onUpload} />
        <VideoUploadPlugin onUpload={upload?.onUpload} />
        <AttachmentUploadPlugin onUpload={upload?.onUpload} />
        {videoConvert && <VideoConvertPlugin {...videoConvert} />}
        <SlashCommandPlugin />
        <MarkdownPlugin />
        <FloatingLinkEditorPlugin />
        <MentionPlugin onSearch={mention?.onSearch} />
        <EmojiPlugin />
        <DragDropPlugin />
        <PastePlugin />
        <CollapsibleHeadingPlugin />
        {selectionActions.length > 0 && <SelectionActionMenuPlugin actions={selectionActions} />}
        {mermaid?.onGenerate && <TextToMermaidPlugin onGenerate={mermaid.onGenerate} />}
        <OnChangePlugin onChange={onChange} />
        {tags && <PageTags value={tags.value} onChange={tags.onChange} suggestions={tags.suggestions} editable={editable} />}
        </div>
        {tableOfContents && <TocSidebar />}
        <Toaster position="bottom-center" />
        </div>
      </EditorConfigProvider>
    </LexicalComposer>
  )
}
