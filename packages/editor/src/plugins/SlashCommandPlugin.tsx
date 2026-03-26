import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { useCallback, useMemo, useState } from 'react'
import { $getSelection, $isRangeSelection, TextNode } from 'lexical'
import { $setBlocksType } from '@lexical/selection'
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from '@lexical/rich-text'
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_CHECK_LIST_COMMAND,
} from '@lexical/list'
import {
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Image,
  Table,
  Video,
  Paperclip,
  CheckSquare,
  Minus,
  ChevronsUpDown,
  Quote,
  Braces,
  GitBranch,
  List,
  ListOrdered,
  Bookmark,
  MapPin,
  type LucideIcon,
} from 'lucide-react'
import * as ReactDOM from 'react-dom'
import {
  INSERT_DIVIDER_COMMAND,
  INSERT_COLLAPSIBLE_COMMAND,
  INSERT_IMAGE_COMMAND,
  INSERT_VIDEO_COMMAND,
  INSERT_ATTACHMENT_COMMAND,
  INSERT_BOOKMARK_COMMAND,
  INSERT_CODE_SNIPPET_COMMAND,
  INSERT_TABLE_COMMAND,
} from './InsertCommands'

class SlashCommandOption extends MenuOption {
  title: string
  icon: LucideIcon
  onSelect: (editor: ReturnType<typeof useLexicalComposerContext>[0]) => void

  constructor(
    title: string,
    icon: LucideIcon,
    onSelect: (editor: ReturnType<typeof useLexicalComposerContext>[0]) => void,
  ) {
    super(title)
    this.title = title
    this.icon = icon
    this.onSelect = onSelect
  }
}

function getSlashCommandOptions(editor: ReturnType<typeof useLexicalComposerContext>[0]): SlashCommandOption[] {
  return [
    new SlashCommandOption('Heading 1', Heading1, (ed) => {
      ed.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('h1'))
        }
      })
    }),
    new SlashCommandOption('Heading 2', Heading2, (ed) => {
      ed.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('h2'))
        }
      })
    }),
    new SlashCommandOption('Heading 3', Heading3, (ed) => {
      ed.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('h3'))
        }
      })
    }),
    new SlashCommandOption('Image', Image, (ed) => {
      ed.dispatchCommand(INSERT_IMAGE_COMMAND, {
        src: 'https://placehold.co/400x300/e2e8f0/64748b?text=Image',
        altText: 'Placeholder',
        width: 400,
        height: 300,
      })
    }),
    new SlashCommandOption('Table', Table, (ed) => {
      ed.focus(() => {
        ed.dispatchCommand(INSERT_TABLE_COMMAND, { rows: 3, columns: 3 })
      })
    }),
    new SlashCommandOption('Video', Video, (ed) => {
      ed.dispatchCommand(INSERT_VIDEO_COMMAND, {
        src: 'https://www.w3schools.com/html/mov_bbb.mp4',
        width: 320,
        height: 180,
      })
    }),
    new SlashCommandOption('Attachment', Paperclip, (ed) => {
      ed.dispatchCommand(INSERT_ATTACHMENT_COMMAND, {
        url: '#',
        fileName: 'document.pdf',
        fileSize: 256 * 1024,
        mimeType: 'application/pdf',
      })
    }),
    new SlashCommandOption('Action Item', CheckSquare, (ed) => {
      ed.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
    }),
    new SlashCommandOption('Divider', Minus, (ed) => {
      ed.dispatchCommand(INSERT_DIVIDER_COMMAND, undefined)
    }),
    new SlashCommandOption('Collapsible', ChevronsUpDown, (ed) => {
      ed.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined)
    }),
    new SlashCommandOption('Quote', Quote, (ed) => {
      ed.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode())
        }
      })
    }),
    new SlashCommandOption('Code Snippet', Braces, (ed) => {
      ed.dispatchCommand(INSERT_CODE_SNIPPET_COMMAND, {
        code: '',
        language: 'javascript',
      })
    }),
    new SlashCommandOption('Mermaid', GitBranch, () => {
      // Placeholder - Mermaid not yet implemented
    }),
    new SlashCommandOption('Bulleted List', List, (ed) => {
      ed.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    }),
    new SlashCommandOption('Numbered List', ListOrdered, (ed) => {
      ed.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    }),
    new SlashCommandOption('Bookmark', Bookmark, (ed) => {
      ed.dispatchCommand(INSERT_BOOKMARK_COMMAND, {
        title: 'Example',
        url: 'https://example.com',
      })
    }),
    new SlashCommandOption('Landmark', MapPin, () => {
      // Placeholder - Landmark not yet implemented
    }),
  ]
}

export function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext()
  const [queryString, setQueryString] = useState<string | null>(null)

  const checkForSlashTrigger = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  })

  const options = useMemo(() => {
    const allOptions = getSlashCommandOptions(editor)
    if (!queryString) return allOptions
    return allOptions.filter((opt) =>
      opt.title.toLowerCase().includes(queryString.toLowerCase()),
    )
  }, [editor, queryString])

  const onSelectOption = useCallback(
    (
      selectedOption: SlashCommandOption,
      nodeToReplace: TextNode | null,
      closeMenu: () => void,
    ) => {
      editor.update(() => {
        if (nodeToReplace) {
          nodeToReplace.remove()
        }
      })
      selectedOption.onSelect(editor)
      closeMenu()
    },
    [editor],
  )

  return (
    <LexicalTypeaheadMenuPlugin<SlashCommandOption>
      onQueryChange={setQueryString}
      onSelectOption={onSelectOption}
      triggerFn={checkForSlashTrigger}
      options={options}
      menuRenderFn={(
        anchorElementRef,
        { selectedIndex, selectOptionAndCleanUp, setHighlightedIndex },
      ) => {
        if (!anchorElementRef.current || options.length === 0) return null
        return ReactDOM.createPortal(
          <div className="le-slash-menu">
            {options.map((option, index) => {
              const Icon = option.icon
              return (
                <button
                  key={option.key}
                  className={`le-slash-menu-item ${
                    selectedIndex === index ? 'le-slash-menu-item-selected' : ''
                  }`}
                  onClick={() => {
                    selectOptionAndCleanUp(option)
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  ref={(el) => {
                    option.setRefElement(el)
                  }}
                >
                  <Icon size={18} />
                  <span>{option.title}</span>
                </button>
              )
            })}
          </div>,
          anchorElementRef.current,
        )
      }}
    />
  )
}
