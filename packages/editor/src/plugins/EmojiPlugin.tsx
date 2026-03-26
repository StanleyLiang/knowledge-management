import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { useCallback, useMemo, useState } from 'react'
import { $createTextNode, TextNode } from 'lexical'
import * as ReactDOM from 'react-dom'

const EMOJI_LIST: Array<{ emoji: string; name: string; keywords: string[] }> = [
  { emoji: '😀', name: 'grinning', keywords: ['happy', 'smile', 'grin'] },
  { emoji: '😂', name: 'joy', keywords: ['laugh', 'funny', 'tears'] },
  { emoji: '😍', name: 'heart eyes', keywords: ['love', 'heart', 'adore'] },
  { emoji: '🤔', name: 'thinking', keywords: ['think', 'hmm', 'consider'] },
  { emoji: '👍', name: 'thumbs up', keywords: ['like', 'ok', 'good', 'yes'] },
  { emoji: '👎', name: 'thumbs down', keywords: ['dislike', 'bad', 'no'] },
  { emoji: '🎉', name: 'party', keywords: ['celebrate', 'tada', 'congrats'] },
  { emoji: '🔥', name: 'fire', keywords: ['hot', 'lit', 'flame'] },
  { emoji: '❤️', name: 'red heart', keywords: ['love', 'heart'] },
  { emoji: '💯', name: 'hundred', keywords: ['perfect', 'score', '100'] },
  { emoji: '✅', name: 'check', keywords: ['done', 'yes', 'complete'] },
  { emoji: '❌', name: 'cross', keywords: ['no', 'wrong', 'delete'] },
  { emoji: '⭐', name: 'star', keywords: ['favorite', 'important'] },
  { emoji: '🚀', name: 'rocket', keywords: ['launch', 'fast', 'ship'] },
  { emoji: '💡', name: 'light bulb', keywords: ['idea', 'tip', 'insight'] },
  { emoji: '⚠️', name: 'warning', keywords: ['alert', 'caution', 'danger'] },
  { emoji: '📝', name: 'memo', keywords: ['note', 'write', 'document'] },
  { emoji: '📌', name: 'pin', keywords: ['pin', 'important', 'mark'] },
  { emoji: '🐛', name: 'bug', keywords: ['bug', 'insect', 'error'] },
  { emoji: '🏗️', name: 'construction', keywords: ['build', 'wip', 'work'] },
  { emoji: '🎯', name: 'target', keywords: ['goal', 'aim', 'bullseye'] },
  { emoji: '📊', name: 'chart', keywords: ['data', 'graph', 'stats'] },
  { emoji: '🔒', name: 'lock', keywords: ['security', 'private', 'locked'] },
  { emoji: '🔑', name: 'key', keywords: ['password', 'access', 'unlock'] },
  { emoji: '📎', name: 'paperclip', keywords: ['attach', 'clip'] },
  { emoji: '📅', name: 'calendar', keywords: ['date', 'schedule', 'event'] },
  { emoji: '⏰', name: 'alarm', keywords: ['time', 'clock', 'deadline'] },
  { emoji: '💬', name: 'speech', keywords: ['comment', 'chat', 'message'] },
  { emoji: '👀', name: 'eyes', keywords: ['look', 'see', 'watch', 'review'] },
  { emoji: '🙏', name: 'pray', keywords: ['thanks', 'please', 'hope'] },
  { emoji: '👋', name: 'wave', keywords: ['hi', 'hello', 'bye'] },
  { emoji: '🎨', name: 'art', keywords: ['design', 'paint', 'creative'] },
  { emoji: '🧪', name: 'test tube', keywords: ['test', 'experiment', 'lab'] },
  { emoji: '🔧', name: 'wrench', keywords: ['fix', 'tool', 'repair'] },
  { emoji: '📦', name: 'package', keywords: ['box', 'delivery', 'ship'] },
  { emoji: '🗑️', name: 'trash', keywords: ['delete', 'remove', 'bin'] },
  { emoji: '✨', name: 'sparkles', keywords: ['new', 'feature', 'magic'] },
  { emoji: '🌟', name: 'glowing star', keywords: ['shine', 'bright'] },
  { emoji: '💻', name: 'laptop', keywords: ['computer', 'code', 'dev'] },
  { emoji: '📱', name: 'phone', keywords: ['mobile', 'cell'] },
]

class EmojiOption extends MenuOption {
  emoji: string
  emojiName: string

  constructor(emoji: string, name: string) {
    super(name)
    this.emoji = emoji
    this.emojiName = name
  }
}

export function EmojiPlugin() {
  const [editor] = useLexicalComposerContext()
  const [queryString, setQueryString] = useState<string | null>(null)

  const checkForEmojiTrigger = useBasicTypeaheadTriggerMatch(':', {
    minLength: 1,
  })

  const options = useMemo(() => {
    if (!queryString) return []
    const q = queryString.toLowerCase()
    return EMOJI_LIST
      .filter(
        (e) =>
          e.name.includes(q) ||
          e.keywords.some((k) => k.includes(q)),
      )
      .slice(0, 10)
      .map((e) => new EmojiOption(e.emoji, e.name))
  }, [queryString])

  const onSelectOption = useCallback(
    (
      selectedOption: EmojiOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        const emojiNode = $createTextNode(selectedOption.emoji)
        if (nodeToReplace) {
          nodeToReplace.replace(emojiNode)
        }
      })
      closeMenu()
    },
    [editor],
  )

  return (
    <LexicalTypeaheadMenuPlugin<EmojiOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForEmojiTrigger}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        if (!anchorElementRef.current || options.length === 0) return null
        return ReactDOM.createPortal(
          <div className="le-emoji-menu">
            {options.map((option, index) => (
              <button
                key={option.key}
                className={`le-emoji-menu-item ${
                  selectedIndex === index ? 'le-emoji-menu-item-selected' : ''
                }`}
                onClick={() => selectOptionAndCleanUp(option)}
                onMouseEnter={() => setHighlightedIndex(index)}
                ref={(el) => option.setRefElement(el)}
              >
                <span className="le-emoji-char">{option.emoji}</span>
                <span className="le-emoji-name">:{option.emojiName}:</span>
              </button>
            ))}
          </div>,
          anchorElementRef.current,
        )
      }}
    />
  )
}
