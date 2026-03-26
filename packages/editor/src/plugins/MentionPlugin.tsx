import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { useCallback, useMemo, useState, useEffect } from 'react'
import { TextNode } from 'lexical'
import * as ReactDOM from 'react-dom'
import { $createMentionNode } from '../nodes/MentionNode'
import type { MentionSearchResult } from '../types'

class MentionOption extends MenuOption {
  data: MentionSearchResult

  constructor(result: MentionSearchResult) {
    super(result.id)
    this.data = result
  }
}

// Default mock data for when no onMentionSearch is provided
const DEFAULT_MENTIONS: MentionSearchResult[] = [
  { id: '1', name: 'Alice Chen', department: 'Engineering', email: 'alice@example.com' },
  { id: '2', name: 'Bob Wang', department: 'Design', email: 'bob@example.com' },
  { id: '3', name: 'Carol Liu', department: 'Product', email: 'carol@example.com' },
  { id: '4', name: 'David Zhang', department: 'Marketing', email: 'david@example.com' },
  { id: '5', name: 'Eve Lin', department: 'Engineering', email: 'eve@example.com' },
]

export function MentionPlugin({
  onSearch,
}: {
  onSearch?: (query: string) => Promise<MentionSearchResult[]>
}) {
  const [editor] = useLexicalComposerContext()
  const [queryString, setQueryString] = useState<string | null>(null)
  const [results, setResults] = useState<MentionSearchResult[]>([])

  const checkForMentionTrigger = useBasicTypeaheadTriggerMatch('@', {
    minLength: 0,
  })

  useEffect(() => {
    if (queryString === null) return

    if (onSearch) {
      onSearch(queryString).then(setResults)
    } else {
      // Fallback: filter default mentions
      const filtered = DEFAULT_MENTIONS.filter((m) =>
        m.name.toLowerCase().includes(queryString.toLowerCase()),
      )
      setResults(filtered)
    }
  }, [queryString, onSearch])

  const options = useMemo(
    () => results.map((r) => new MentionOption(r)),
    [results],
  )

  const onSelectOption = useCallback(
    (
      selectedOption: MentionOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const mentionNode = $createMentionNode(
          selectedOption.data.id,
          selectedOption.data.name,
        )
        if (nodeToReplace) {
          nodeToReplace.replace(mentionNode)
        }
      })
      closeMenu()
    },
    [editor],
  )

  return (
    <LexicalTypeaheadMenuPlugin<MentionOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForMentionTrigger}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        if (!anchorElementRef.current || options.length === 0) return null
        return ReactDOM.createPortal(
          <div className="le-mention-menu">
            {options.map((option, index) => (
              <button
                key={option.key}
                className={`le-mention-menu-item ${
                  selectedIndex === index ? 'le-mention-menu-item-selected' : ''
                }`}
                onClick={() => selectOptionAndCleanUp(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                ref={(el) => option.setRefElement(el)}
              >
                <div className="le-mention-avatar">
                  {option.data.avatar ? (
                    <img src={option.data.avatar} alt="" />
                  ) : (
                    <span>{option.data.name[0]}</span>
                  )}
                </div>
                <div className="le-mention-info">
                  <span className="le-mention-name">{option.data.name}</span>
                  {option.data.department && (
                    <span className="le-mention-dept">{option.data.department}</span>
                  )}
                </div>
              </button>
            ))}
          </div>,
          anchorElementRef.current,
        )
      }}
    />
  )
}
