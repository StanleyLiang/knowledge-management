import {
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  $createParagraphNode,
  type TextFormatType,
} from 'lexical'
import { $setBlocksType } from '@lexical/selection'
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from '@lexical/rich-text'
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
} from '@lexical/list'
import { $getSelection, $isRangeSelection } from 'lexical'
import { TOGGLE_LINK_COMMAND } from '@lexical/link'
import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Superscript,
  Subscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Image,
  Video,
  Paperclip,
  Link,
  MoreHorizontal,
  ChevronDown,
  Type,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Table,
  FileSearch,
  Minus,
  Quote,
  ChevronsUpDown,
  CheckSquare,
  Braces,
  GitBranch,
  Bookmark,
  MapPin,
} from 'lucide-react'

import { INSERT_CHECK_LIST_COMMAND } from '@lexical/list'
import {
  INSERT_DIVIDER_COMMAND,
  INSERT_BOOKMARK_COMMAND,
  INSERT_COLLAPSIBLE_COMMAND,
  INSERT_IMAGE_COMMAND,
  INSERT_VIDEO_COMMAND,
  UPLOAD_VIDEO_COMMAND,
  INSERT_ATTACHMENT_COMMAND,
  INSERT_CODE_SNIPPET_COMMAND,
  INSERT_MERMAID_COMMAND,
  INSERT_LANDMARK_COMMAND,
  UPLOAD_IMAGE_COMMAND,
} from '../../plugins/InsertCommands'
import React from 'react'
import { useToolbarState, type BlockType } from '../../hooks/useToolbarState'
import { Toggle } from '../ui/toggle'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Dropdown, DropdownItem } from '../ui/dropdown'
import { Tooltip } from '../ui/tooltip'
import { TableInsertDropdown } from './TableInsertDropdown'
import { TextColorPicker, TextBgColorPicker } from './ColorPicker'

const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  paragraph: 'Normal Text',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  quote: 'Quote',
  bullet: 'Bulleted List',
  number: 'Numbered List',
}

export function Toolbar() {
  const { editor, state } = useToolbarState()
  const imageInputRef = React.useRef<HTMLInputElement>(null)
  const videoInputRef = React.useRef<HTMLInputElement>(null)

  const formatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)
  }

  const setBlockType = (type: BlockType) => {
    editor.update(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      if (type === 'paragraph') {
        $setBlocksType(selection, () => $createParagraphNode())
      } else if (type.startsWith('h')) {
        $setBlocksType(selection, () => $createHeadingNode(type as HeadingTagType))
      } else if (type === 'quote') {
        $setBlocksType(selection, () => $createQuoteNode())
      } else if (type === 'bullet') {
        editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
      } else if (type === 'number') {
        editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
      }
    })
  }

  return (
    <div className="le-toolbar">
      {/* Hidden file inputs for upload */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            editor.dispatchCommand(UPLOAD_IMAGE_COMMAND, file)
            e.target.value = ''
          }
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) {
            editor.dispatchCommand(UPLOAD_VIDEO_COMMAND, file)
            e.target.value = ''
          }
        }}
      />

      {/* Undo / Redo */}
      <Tooltip content="Undo">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
        >
          <Undo2 size={16} />
        </Button>
      </Tooltip>
      <Tooltip content="Redo">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
        >
          <Redo2 size={16} />
        </Button>
      </Tooltip>

      <Separator />

      {/* Heading Dropdown */}
      <Dropdown
        trigger={
          <Button variant="ghost" size="sm" className="le-toolbar-dropdown-trigger">
            {BLOCK_TYPE_LABELS[state.blockType]}
            <ChevronDown size={14} />
          </Button>
        }
      >
        <DropdownItem active={state.blockType === 'paragraph'} onClick={() => setBlockType('paragraph')}>
          <Type size={16} /> Normal Text
        </DropdownItem>
        <DropdownItem active={state.blockType === 'h1'} onClick={() => setBlockType('h1')}>
          <Heading1 size={16} /> Heading 1
        </DropdownItem>
        <DropdownItem active={state.blockType === 'h2'} onClick={() => setBlockType('h2')}>
          <Heading2 size={16} /> Heading 2
        </DropdownItem>
        <DropdownItem active={state.blockType === 'h3'} onClick={() => setBlockType('h3')}>
          <Heading3 size={16} /> Heading 3
        </DropdownItem>
        <DropdownItem active={state.blockType === 'h4'} onClick={() => setBlockType('h4')}>
          <Heading4 size={16} /> Heading 4
        </DropdownItem>
        <DropdownItem active={state.blockType === 'h5'} onClick={() => setBlockType('h5')}>
          <Heading5 size={16} /> Heading 5
        </DropdownItem>
        <DropdownItem active={state.blockType === 'h6'} onClick={() => setBlockType('h6')}>
          <Heading6 size={16} /> Heading 6
        </DropdownItem>
      </Dropdown>

      <Separator />

      {/* Bold / Italic */}
      <Tooltip content="Bold">
        <Toggle pressed={state.isBold} onClick={() => formatText('bold')} size="icon">
          <Bold size={16} />
        </Toggle>
      </Tooltip>
      <Tooltip content="Italic">
        <Toggle pressed={state.isItalic} onClick={() => formatText('italic')} size="icon">
          <Italic size={16} />
        </Toggle>
      </Tooltip>

      {/* More Format Dropdown */}
      <Dropdown
        trigger={
          <Button variant="ghost" size="icon">
            <MoreHorizontal size={16} />
          </Button>
        }
      >
        <DropdownItem active={state.isUnderline} onClick={() => formatText('underline')}>
          <Underline size={16} /> Underline
        </DropdownItem>
        <DropdownItem active={state.isStrikethrough} onClick={() => formatText('strikethrough')}>
          <Strikethrough size={16} /> Strikethrough
        </DropdownItem>
        <DropdownItem active={state.isCode} onClick={() => formatText('code')}>
          <Code size={16} /> Inline Code
        </DropdownItem>
        <DropdownItem active={state.isSuperscript} onClick={() => formatText('superscript')}>
          <Superscript size={16} /> Superscript
        </DropdownItem>
        <DropdownItem active={state.isSubscript} onClick={() => formatText('subscript')}>
          <Subscript size={16} /> Subscript
        </DropdownItem>
      </Dropdown>

      <Separator />

      {/* Text Color / BG Color */}
      <TextColorPicker />
      <TextBgColorPicker />

      <Separator />

      {/* Text Align */}
      <Dropdown
        trigger={
          <Button variant="ghost" size="icon">
            {state.textAlign === 'center' ? (
              <AlignCenter size={16} />
            ) : state.textAlign === 'right' ? (
              <AlignRight size={16} />
            ) : (
              <AlignLeft size={16} />
            )}
          </Button>
        }
      >
        <DropdownItem
          active={state.textAlign === 'left'}
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
        >
          <AlignLeft size={16} /> Align Left
        </DropdownItem>
        <DropdownItem
          active={state.textAlign === 'center'}
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
        >
          <AlignCenter size={16} /> Align Center
        </DropdownItem>
        <DropdownItem
          active={state.textAlign === 'right'}
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
        >
          <AlignRight size={16} /> Align Right
        </DropdownItem>
      </Dropdown>

      <Separator />

      {/* List */}
      <Dropdown
        trigger={
          <Button variant="ghost" size="icon">
            <List size={16} />
          </Button>
        }
      >
        <DropdownItem
          active={state.blockType === 'bullet'}
          onClick={() => setBlockType('bullet')}
        >
          <List size={16} /> Bulleted List
        </DropdownItem>
        <DropdownItem
          active={state.blockType === 'number'}
          onClick={() => setBlockType('number')}
        >
          <ListOrdered size={16} /> Numbered List
        </DropdownItem>
      </Dropdown>

      <Separator />

      {/* Outdent / Indent */}
      <Tooltip content="Outdent">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined)}
        >
          <Outdent size={16} />
        </Button>
      </Tooltip>
      <Tooltip content="Indent">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined)}
        >
          <Indent size={16} />
        </Button>
      </Tooltip>

      <Separator />

      {/* Insert items */}
      <Tooltip content="Image">
        <Button variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()}>
          <Image size={16} />
        </Button>
      </Tooltip>

      {/* Table dropdown */}
      <TableInsertDropdown />

      <Tooltip content="Create Link">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => editor.dispatchCommand(TOGGLE_LINK_COMMAND, 'https://')}
        >
          <Link size={16} />
        </Button>
      </Tooltip>

      {/* Link to Page */}
      <Dropdown
        trigger={
          <Button variant="ghost" size="icon">
            <FileSearch size={16} />
          </Button>
        }
      >
        <div className="le-dropdown-item">Link to Page (coming soon)</div>
      </Dropdown>

      <Tooltip content="Video">
        <Button variant="ghost" size="icon" onClick={() => videoInputRef.current?.click()}>
          <Video size={16} />
        </Button>
      </Tooltip>

      <Tooltip content="Attachment">
        <Button variant="ghost" size="icon" onClick={() => {
          editor.dispatchCommand(INSERT_ATTACHMENT_COMMAND, {
            url: '#',
            fileName: 'document.pdf',
            fileSize: 1024 * 256,
            mimeType: 'application/pdf',
          })
        }}>
          <Paperclip size={16} />
        </Button>
      </Tooltip>

      {/* More Insert Dropdown */}
      <Dropdown
        trigger={
          <Button variant="ghost" size="icon">
            <MoreHorizontal size={16} />
          </Button>
        }
        align="end"
      >
        <DropdownItem onClick={() => editor.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)}>
          <CheckSquare size={16} /> Action Item
        </DropdownItem>
        <div className="le-separator-h" />
        <DropdownItem onClick={() => editor.dispatchCommand(INSERT_DIVIDER_COMMAND, undefined)}>
          <Minus size={16} /> Divider
        </DropdownItem>
        <DropdownItem onClick={() => editor.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined)}>
          <ChevronsUpDown size={16} /> Collapsible
        </DropdownItem>
        <DropdownItem onClick={() => setBlockType('quote')}>
          <Quote size={16} /> Quote
        </DropdownItem>
        <DropdownItem onClick={() => editor.dispatchCommand(INSERT_CODE_SNIPPET_COMMAND, { code: '// Your code here\nconsole.log("Hello World");', language: 'javascript' })}>
          <Braces size={16} /> Code Snippet
        </DropdownItem>
        <DropdownItem onClick={() => editor.dispatchCommand(INSERT_MERMAID_COMMAND, { source: 'graph TD\n    A[Start] --> B[Process] --> C[End]' })}>
          <GitBranch size={16} /> Mermaid
        </DropdownItem>
        <DropdownItem onClick={() => editor.dispatchCommand(INSERT_BOOKMARK_COMMAND, { title: 'Example', url: 'https://example.com' })}>
          <Bookmark size={16} /> Bookmark
        </DropdownItem>
        <DropdownItem onClick={() => editor.dispatchCommand(INSERT_LANDMARK_COMMAND, {})}>
          <MapPin size={16} /> Landmark
        </DropdownItem>
      </Dropdown>
    </div>
  )
}
