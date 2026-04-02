import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helpers for building Lexical JSON
const t = (text: string, format = 0, style = '') => ({
  detail: 0, format, mode: 'normal' as const, style, text, type: 'text' as const, version: 1,
})

const p = (children: unknown[], format = '', indent = 0) => ({
  children, direction: 'ltr' as const, format, indent, type: 'paragraph' as const, version: 1,
  textStyle: '', textFormat: 0,
})

const h = (tag: string, children: unknown[]) => ({
  children, direction: 'ltr' as const, format: '', indent: 0, type: 'heading' as const, version: 1, tag,
})

const li = (children: unknown[], checked?: boolean) => ({
  children, direction: 'ltr' as const, format: '', indent: 0, type: 'listitem' as const, version: 1, value: 1,
  ...(checked !== undefined ? { checked } : {}),
})

const list = (items: unknown[], listType: string, tag: string) => ({
  children: items, direction: 'ltr' as const, format: '', indent: 0,
  type: 'list' as const, version: 1, listType, start: 1, tag,
})

const wrap = (children: unknown[]) => ({
  root: {
    children,
    direction: 'ltr' as const,
    format: '',
    indent: 0,
    type: 'root' as const,
    version: 1,
  },
})

const BLANK_CONTENT = wrap([p([t('')])])

const MEETING_NOTES_CONTENT = wrap([
  h('h1', [t('Meeting Notes')]),
  p([t('Date:', 1), t(' [Date]')]),
  p([t('Attendees:', 1), t(' [Names]')]),
  p([]),
  h('h2', [t('Agenda')]),
  list([
    li([t('[Topic 1]')]),
    li([t('[Topic 2]')]),
    li([t('[Topic 3]')]),
  ], 'number', 'ol'),
  p([]),
  h('h2', [t('Discussion')]),
  p([t('[Notes here]')]),
  p([]),
  h('h2', [t('Action Items')]),
  list([
    li([t('[Action item 1] — Owner: [Name]')], false),
    li([t('[Action item 2] — Owner: [Name]')], false),
  ], 'check', 'ul'),
  p([]),
  h('h2', [t('Next Steps')]),
  p([t('[Follow-up items and next meeting date]')]),
])

const RFC_CONTENT = wrap([
  h('h1', [t('[RFC Title]')]),
  p([t('Author:', 1), t(' [Name]  '), t('|', 0), t('  Status:', 1), t(' Draft')]),
  p([]),
  { type: 'divider' as const, version: 1 },
  p([]),
  h('h2', [t('Summary')]),
  p([t('[One paragraph summary of the proposal]')]),
  p([]),
  h('h2', [t('Motivation')]),
  p([t('[Why is this change needed? What problem does it solve?]')]),
  p([]),
  h('h2', [t('Proposed Solution')]),
  p([t('[Detailed description of the proposed approach]')]),
  p([]),
  h('h2', [t('Alternatives Considered')]),
  p([t('[What other approaches were considered and why were they rejected?]')]),
  p([]),
  h('h2', [t('Open Questions')]),
  list([
    li([t('[Question 1]')]),
    li([t('[Question 2]')]),
  ], 'bullet', 'ul'),
  p([]),
  h('h2', [t('References')]),
  p([t('[Links to related documents, prior art, etc.]')]),
])

const HOWTO_CONTENT = wrap([
  h('h1', [t('How to [Task]')]),
  p([]),
  h('h2', [t('Overview')]),
  p([t('[Brief description of what this guide covers and who it is for]')]),
  p([]),
  h('h2', [t('Prerequisites')]),
  list([
    li([t('[Prerequisite 1]')]),
    li([t('[Prerequisite 2]')]),
  ], 'bullet', 'ul'),
  p([]),
  h('h2', [t('Steps')]),
  h('h3', [t('Step 1: [Title]')]),
  p([t('[Detailed instructions for step 1]')]),
  p([]),
  h('h3', [t('Step 2: [Title]')]),
  p([t('[Detailed instructions for step 2]')]),
  p([]),
  h('h3', [t('Step 3: [Title]')]),
  p([t('[Detailed instructions for step 3]')]),
  p([]),
  h('h2', [t('Troubleshooting')]),
  p([t('[Common issues and their solutions]')]),
])

async function main() {
  // Upsert templates (idempotent)
  const templates = [
    {
      name: 'Blank',
      description: 'Start with an empty page',
      icon: 'file',
      content: BLANK_CONTENT,
      sortOrder: 0,
    },
    {
      name: 'Meeting Notes',
      description: 'Agenda, discussion, and action items',
      icon: 'clipboard-list',
      content: MEETING_NOTES_CONTENT,
      sortOrder: 1,
    },
    {
      name: 'RFC',
      description: 'Request for Comments — propose and discuss changes',
      icon: 'file-text',
      content: RFC_CONTENT,
      sortOrder: 2,
    },
    {
      name: 'How-To Guide',
      description: 'Step-by-step instructions for a task',
      icon: 'book-open',
      content: HOWTO_CONTENT,
      sortOrder: 3,
    },
  ]

  for (const tmpl of templates) {
    const existing = await prisma.pageTemplate.findFirst({ where: { name: tmpl.name } })
    if (existing) {
      await prisma.pageTemplate.update({ where: { id: existing.id }, data: tmpl })
      console.log(`Updated template: ${tmpl.name}`)
    } else {
      await prisma.pageTemplate.create({ data: tmpl })
      console.log(`Created template: ${tmpl.name}`)
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e)
    prisma.$disconnect()
    process.exit(1)
  })
