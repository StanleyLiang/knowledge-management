import { useCallback, useEffect, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  COMMAND_PRIORITY_HIGH,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
  type LexicalEditor,
} from 'lexical'
import { $isLinkNode } from '@lexical/link'
import { $isAtNodeEnd } from '@lexical/selection'
import { mergeRegister } from '@lexical/utils'
import { createPortal } from 'react-dom'
import type { LucideIcon } from 'lucide-react'

export interface SelectionAction {
  key: string
  label: string
  icon: LucideIcon
  onAction: (selectedText: string, anchorBlockKey: string, editor: LexicalEditor) => void
}

function getSelectedNode(selection: ReturnType<typeof $getSelection>) {
  if (!$isRangeSelection(selection)) return null
  const anchor = selection.anchor
  const focus = selection.focus
  const anchorNode = anchor.getNode()
  const focusNode = focus.getNode()
  if (anchorNode === focusNode) return anchorNode
  const isBackward = selection.isBackward()
  return isBackward
    ? $isAtNodeEnd(focus) ? anchorNode : focusNode
    : $isAtNodeEnd(anchor) ? focusNode : anchorNode
}

function SelectionActionMenu({
  actions,
  portalContainer,
}: {
  actions: SelectionAction[]
  portalContainer: HTMLElement
}) {
  const [editor] = useLexicalComposerContext()
  const menuRef = useRef<HTMLDivElement | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const isVisibleRef = useRef(false)
  // Use refs for action data so they persist through re-renders when menu hides
  const selectedTextRef = useRef<string>('')
  const anchorBlockKeyRef = useRef<string>('')

  isVisibleRef.current = isVisible

  const updateMenu = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection) || selection.isCollapsed()) {
      setIsVisible(false)
      return
    }

    // Hide if selection is on a link node
    const node = getSelectedNode(selection)
    if (node) {
      const parent = node.getParent()
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsVisible(false)
        return
      }
    }

    const text = selection.getTextContent().trim()
    if (!text) {
      setIsVisible(false)
      return
    }

    // Capture the anchor block key for use in actions
    const anchorNode = selection.anchor.getNode()
    const topBlock = anchorNode.getTopLevelElement()
    anchorBlockKeyRef.current = topBlock?.getKey() ?? ''

    selectedTextRef.current = text

    const nativeSelection = window.getSelection()
    const rootElement = editor.getRootElement()
    if (!nativeSelection || !rootElement || !rootElement.contains(nativeSelection.anchorNode) || !menuRef.current) {
      setIsVisible(false)
      return
    }

    const rangeRect = nativeSelection.getRangeAt(0).getBoundingClientRect()
    const containerRect = portalContainer.getBoundingClientRect()

    // Position above the selection, clamped to stay within the editor
    const menuEl = menuRef.current
    const rawTop = rangeRect.top - containerRect.top - 44
    menuEl.style.top = `${Math.max(0, rawTop)}px`
    menuEl.style.left = `${rangeRect.left - containerRect.left + rangeRect.width / 2}px`

    setIsVisible(true)
  }, [editor, portalContainer])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => updateMenu())
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateMenu()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (isVisibleRef.current) {
            setIsVisible(false)
            return true
          }
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [editor, updateMenu])

  return createPortal(
    <div
      ref={menuRef}
      className="le-selection-action-menu"
      style={{ display: isVisible ? 'flex' : 'none' }}
    >
      {actions.map((action) => {
        const Icon = action.icon
        return (
          <button
            key={action.key}
            className="le-selection-action-btn"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              action.onAction(selectedTextRef.current, anchorBlockKeyRef.current, editor)
              setIsVisible(false)
            }}
          >
            <Icon size={14} />
            <span>{action.label}</span>
          </button>
        )
      })}
    </div>,
    portalContainer,
  )
}

export function SelectionActionMenuPlugin({ actions }: { actions: SelectionAction[] }) {
  const [editor] = useLexicalComposerContext()
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    return editor.registerRootListener((newRootElement) => {
      setRootElement(newRootElement)
    })
  }, [editor])

  if (!rootElement || actions.length === 0) return null

  // Portal into the parent container, not the contenteditable root
  const portalContainer = rootElement.parentElement
  if (!portalContainer) return null

  return <SelectionActionMenu actions={actions} portalContainer={portalContainer} />
}
