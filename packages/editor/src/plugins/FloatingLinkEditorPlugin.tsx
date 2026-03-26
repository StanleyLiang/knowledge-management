import { useCallback, useEffect, useRef, useState } from 'react'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_HIGH,
  COMMAND_PRIORITY_LOW,
  KEY_ESCAPE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import { $isLinkNode, TOGGLE_LINK_COMMAND } from '@lexical/link'
import { $isAtNodeEnd } from '@lexical/selection'
import { mergeRegister, $getNearestNodeOfType } from '@lexical/utils'
import { createPortal } from 'react-dom'
import { Check, X, Pencil, ExternalLink, Trash2 } from 'lucide-react'

function getSelectedNode(selection: ReturnType<typeof $getSelection>) {
  if (!$isRangeSelection(selection)) return null
  const anchor = selection.anchor
  const focus = selection.focus
  const anchorNode = selection.anchor.getNode()
  const focusNode = selection.focus.getNode()
  if (anchorNode === focusNode) return anchorNode
  const isBackward = selection.isBackward()
  return isBackward
    ? $isAtNodeEnd(focus) ? anchorNode : focusNode
    : $isAtNodeEnd(anchor) ? focusNode : anchorNode
}

function FloatingLinkEditor({ anchorElem }: { anchorElem: HTMLElement }) {
  const [editor] = useLexicalComposerContext()
  const editorRef = useRef<HTMLDivElement | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [editedUrl, setEditedUrl] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isLink, setIsLink] = useState(false)

  const updateLinkEditor = useCallback(() => {
    const selection = $getSelection()
    if (!$isRangeSelection(selection)) {
      setIsLink(false)
      return
    }

    const node = getSelectedNode(selection)
    if (!node) {
      setIsLink(false)
      return
    }

    const parent = node.getParent()
    if ($isLinkNode(parent)) {
      setLinkUrl(parent.getURL())
      setIsLink(true)
    } else if ($isLinkNode(node)) {
      setLinkUrl(node.getURL())
      setIsLink(true)
    } else {
      setLinkUrl('')
      setIsLink(false)
    }

    const nativeSelection = window.getSelection()
    const rootElement = editor.getRootElement()
    if (
      !nativeSelection ||
      !rootElement ||
      !rootElement.contains(nativeSelection.anchorNode) ||
      !editorRef.current
    ) {
      return
    }

    const rangeRect = nativeSelection.getRangeAt(0).getBoundingClientRect()
    const rootRect = rootElement.getBoundingClientRect()

    if (editorRef.current) {
      editorRef.current.style.top = `${rangeRect.bottom - rootRect.top + 8}px`
      editorRef.current.style.left = `${rangeRect.left - rootRect.left}px`
    }
  }, [editor])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => updateLinkEditor())
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          updateLinkEditor()
          return false
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        KEY_ESCAPE_COMMAND,
        () => {
          if (isLink) {
            setIsLink(false)
            return true
          }
          return false
        },
        COMMAND_PRIORITY_HIGH,
      ),
    )
  }, [editor, updateLinkEditor, isLink])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    if (editedUrl.trim()) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, editedUrl.trim())
    }
    setIsEditing(false)
  }

  const handleRemove = () => {
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null)
    setIsLink(false)
    setIsEditing(false)
  }

  if (!isLink) return null

  return (
    <div ref={editorRef} className="le-floating-link-editor">
      {isEditing ? (
        <div className="le-floating-link-edit">
          <input
            ref={inputRef}
            value={editedUrl}
            onChange={(e) => setEditedUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setIsEditing(false)
            }}
            className="le-floating-link-input"
            placeholder="https://..."
          />
          <button onClick={handleSave} className="le-floating-link-btn">
            <Check size={14} />
          </button>
          <button onClick={() => setIsEditing(false)} className="le-floating-link-btn">
            <X size={14} />
          </button>
        </div>
      ) : (
        <div className="le-floating-link-view">
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="le-floating-link-url"
          >
            {linkUrl}
            <ExternalLink size={12} />
          </a>
          <button
            onClick={() => {
              setEditedUrl(linkUrl)
              setIsEditing(true)
            }}
            className="le-floating-link-btn"
          >
            <Pencil size={14} />
          </button>
          <button onClick={handleRemove} className="le-floating-link-btn le-floating-link-btn-danger">
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}

export function FloatingLinkEditorPlugin() {
  const [editor] = useLexicalComposerContext()
  const [rootElement, setRootElement] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setRootElement(editor.getRootElement())
  }, [editor])

  if (!rootElement) return null

  return createPortal(
    <FloatingLinkEditor anchorElem={rootElement} />,
    rootElement,
  )
}
