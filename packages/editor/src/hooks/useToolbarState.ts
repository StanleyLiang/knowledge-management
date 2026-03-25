import { useCallback, useEffect, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type TextFormatType,
} from 'lexical'
import { $isHeadingNode, type HeadingTagType } from '@lexical/rich-text'
import { $isListNode, ListNode } from '@lexical/list'
import { $isLinkNode } from '@lexical/link'
import { $findMatchingParent, $getNearestNodeOfType } from '@lexical/utils'

export type BlockType =
  | 'paragraph'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'h4'
  | 'h5'
  | 'h6'
  | 'quote'
  | 'bullet'
  | 'number'

export interface ToolbarState {
  blockType: BlockType
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isStrikethrough: boolean
  isCode: boolean
  isSuperscript: boolean
  isSubscript: boolean
  isLink: boolean
  canUndo: boolean
  canRedo: boolean
  textAlign: 'left' | 'center' | 'right' | 'justify'
}

const INITIAL_STATE: ToolbarState = {
  blockType: 'paragraph',
  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrikethrough: false,
  isCode: false,
  isSuperscript: false,
  isSubscript: false,
  isLink: false,
  canUndo: false,
  canRedo: false,
  textAlign: 'left',
}

export function useToolbarState() {
  const [editor] = useLexicalComposerContext()
  const [state, setState] = useState<ToolbarState>(INITIAL_STATE)

  const updateState = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      if (!$isRangeSelection(selection)) return

      // Block type
      const anchorNode = selection.anchor.getNode()
      let element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : $findMatchingParent(anchorNode, (e) => {
              const parent = e.getParent()
              return parent !== null && $isRootOrShadowRoot(parent)
            })

      if (element === null) {
        element = anchorNode.getTopLevelElementOrThrow()
      }

      let blockType: BlockType = 'paragraph'

      if ($isHeadingNode(element)) {
        blockType = element.getTag() as BlockType
      } else if ($isListNode(element)) {
        const parentList = $getNearestNodeOfType(anchorNode, ListNode)
        if (parentList) {
          blockType = parentList.getListType() === 'bullet' ? 'bullet' : 'number'
        }
      } else if (element.getType() === 'quote') {
        blockType = 'quote'
      }

      // Text format
      const isBold = selection.hasFormat('bold')
      const isItalic = selection.hasFormat('italic')
      const isUnderline = selection.hasFormat('underline')
      const isStrikethrough = selection.hasFormat('strikethrough')
      const isCode = selection.hasFormat('code')
      const isSuperscript = selection.hasFormat('superscript')
      const isSubscript = selection.hasFormat('subscript')

      // Link
      const node = selection.anchor.getNode()
      const parent = node.getParent()
      const isLink = $isLinkNode(parent) || $isLinkNode(node)

      // Text align
      const elementFormat = element.getFormatType?.() ?? 'left'
      const textAlign = (['left', 'center', 'right', 'justify'].includes(elementFormat)
        ? elementFormat
        : 'left') as ToolbarState['textAlign']

      setState({
        blockType,
        isBold,
        isItalic,
        isUnderline,
        isStrikethrough,
        isCode,
        isSuperscript,
        isSubscript,
        isLink,
        canUndo: false, // Updated via separate listener
        canRedo: false,
        textAlign,
      })
    })
  }, [editor])

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        updateState()
        return false
      },
      COMMAND_PRIORITY_CRITICAL,
    )
  }, [editor, updateState])

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        updateState()
      })
    })
  }, [editor, updateState])

  // Undo/Redo state
  useEffect(() => {
    return editor.registerCommand(
      FORMAT_TEXT_COMMAND,
      () => {
        updateState()
        return false
      },
      COMMAND_PRIORITY_CRITICAL,
    )
  }, [editor, updateState])

  return { editor, state }
}
