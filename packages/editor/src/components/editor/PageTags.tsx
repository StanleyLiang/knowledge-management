import { useState, useCallback } from 'react'
import { X, Plus } from 'lucide-react'

interface PageTagsProps {
  value: string[]
  onChange: (tags: string[]) => void
  suggestions?: string[]
  editable?: boolean
}

export function PageTags({ value, onChange, suggestions = [], editable = true }: PageTagsProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim()
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed])
      }
      setInput('')
      setShowSuggestions(false)
    },
    [value, onChange],
  )

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag))
    },
    [value, onChange],
  )

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const filteredSuggestions = suggestions.filter(
    (s) => s.toLowerCase().includes(input.toLowerCase()) && !value.includes(s),
  )

  return (
    <div className="le-page-tags">
      <div className="le-page-tags-list">
        {value.map((tag) => (
          <span key={tag} className="le-page-tag">
            {tag}
            {editable && (
              <button onClick={() => removeTag(tag)} className="le-page-tag-remove">
                <X size={12} />
              </button>
            )}
          </span>
        ))}
        {editable && (
          <div className="le-page-tags-input-wrapper">
            <input
              value={input}
              onChange={(e) => {
                setInput(e.target.value)
                setShowSuggestions(true)
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Add tag..."
              className="le-page-tags-input"
            />
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="le-page-tags-suggestions">
                {filteredSuggestions.slice(0, 8).map((s) => (
                  <button
                    key={s}
                    className="le-page-tags-suggestion"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => addTag(s)}
                  >
                    <Plus size={12} /> {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
