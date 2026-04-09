import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import {
  LexicalTypeaheadMenuPlugin,
  MenuOption,
  useBasicTypeaheadTriggerMatch,
} from '@lexical/react/LexicalTypeaheadMenuPlugin'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { $getSelection, $isRangeSelection, TextNode } from 'lexical'
import { $setBlocksType } from '@lexical/selection'
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text'
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
import { createPortal } from 'react-dom'
import {
  INSERT_DIVIDER_COMMAND,
  INSERT_COLLAPSIBLE_COMMAND,
  INSERT_BOOKMARK_COMMAND,
  INSERT_CODE_SNIPPET_COMMAND,
  INSERT_TABLE_COMMAND,
  INSERT_MERMAID_COMMAND,
  INSERT_LANDMARK_COMMAND,
} from './InsertCommands'
import { editorEventBus } from '../utils/eventBus'

class SlashCommandOption extends MenuOption {
  title: string
  iconComponent: LucideIcon
  onSelect: (editor: ReturnType<typeof useLexicalComposerContext>[0]) => void

  constructor(
    title: string,
    icon: LucideIcon,
    onSelect: (editor: ReturnType<typeof useLexicalComposerContext>[0]) => void,
  ) {
    super(title)
    this.title = title
    this.iconComponent = icon
    this.onSelect = onSelect
  }
}

type TranslateFn = ReturnType<typeof useTranslation>['t']

function getSlashCommandOptions(_editor: ReturnType<typeof useLexicalComposerContext>[0], t: TranslateFn): SlashCommandOption[] {
  return [
    new SlashCommandOption(t('slashCommand.heading1'), Heading1, (ed) => {
      ed.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('h1'))
        }
      })
    }),
    new SlashCommandOption(t('slashCommand.heading2'), Heading2, (ed) => {
      ed.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('h2'))
        }
      })
    }),
    new SlashCommandOption(t('slashCommand.heading3'), Heading3, (ed) => {
      ed.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('h3'))
        }
      })
    }),
    new SlashCommandOption(t('slashCommand.heading4'), Heading4, (ed) => {
      ed.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('h4'))
        }
      })
    }),
    new SlashCommandOption(t('slashCommand.heading5'), Heading5, (ed) => {
      ed.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('h5'))
        }
      })
    }),
    new SlashCommandOption(t('slashCommand.heading6'), Heading6, (ed) => {
      ed.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode('h6'))
        }
      })
    }),
    new SlashCommandOption(t('slashCommand.image'), Image, () => {
      editorEventBus.emit('trigger:image-upload')
    }),
    new SlashCommandOption(t('slashCommand.table'), Table, (ed) => {
      ed.focus(() => {
        ed.dispatchCommand(INSERT_TABLE_COMMAND, { rows: 3, columns: 3 })
      })
    }),
    new SlashCommandOption(t('slashCommand.video'), Video, () => {
      editorEventBus.emit('trigger:video-upload')
    }),
    new SlashCommandOption(t('slashCommand.attachment'), Paperclip, () => {
      editorEventBus.emit('trigger:attachment-upload')
    }),
    new SlashCommandOption(t('slashCommand.actionItem'), CheckSquare, (ed) => {
      ed.dispatchCommand(INSERT_CHECK_LIST_COMMAND, undefined)
    }),
    new SlashCommandOption(t('slashCommand.divider'), Minus, (ed) => {
      ed.dispatchCommand(INSERT_DIVIDER_COMMAND, undefined)
    }),
    new SlashCommandOption(t('slashCommand.collapsible'), ChevronsUpDown, (ed) => {
      ed.dispatchCommand(INSERT_COLLAPSIBLE_COMMAND, undefined)
    }),
    new SlashCommandOption(t('slashCommand.quote'), Quote, (ed) => {
      ed.update(() => {
        const selection = $getSelection()
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode())
        }
      })
    }),
    new SlashCommandOption(t('slashCommand.codeSnippet'), Braces, (ed) => {
      ed.dispatchCommand(INSERT_CODE_SNIPPET_COMMAND, {
        code: '',
        language: 'javascript',
      })
    }),
    new SlashCommandOption(t('slashCommand.mermaid'), GitBranch, (ed) => {
      ed.dispatchCommand(INSERT_MERMAID_COMMAND, {
        source: 'graph TD\n    A[Start] --> B[Process] --> C[End]',
      })
    }),
    new SlashCommandOption(t('slashCommand.bulletedList'), List, (ed) => {
      ed.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
    }),
    new SlashCommandOption(t('slashCommand.numberedList'), ListOrdered, (ed) => {
      ed.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)
    }),
    new SlashCommandOption(t('slashCommand.bookmark'), Bookmark, (ed) => {
      ed.dispatchCommand(INSERT_BOOKMARK_COMMAND, {
        title: 'Example',
        url: 'https://example.com',
      })
    }),
    new SlashCommandOption(t('slashCommand.landmark'), MapPin, (ed) => {
      ed.dispatchCommand(INSERT_LANDMARK_COMMAND, {})
    }),
  ]
}

export function SlashCommandPlugin() {
  const [editor] = useLexicalComposerContext()
  const { t } = useTranslation('lexicalEditor')
  const [queryString, setQueryString] = useState<string | null>(null)

  const checkForSlashTrigger = useBasicTypeaheadTriggerMatch('/', {
    minLength: 0,
  })

  const options = useMemo(() => {
    const allOptions = getSlashCommandOptions(editor, t)
    if (!queryString) return allOptions
    return allOptions.filter((opt) =>
      opt.title.toLowerCase().includes(queryString.toLowerCase()),
    )
  }, [editor, queryString, t])

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
        return createPortal(
          <div className="le-slash-menu">
            {options.map((option, index) => {
              const Icon = option.iconComponent
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
