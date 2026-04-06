import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import { TableOfContentsPlugin } from '../plugins/TableOfContentsPlugin'

export function TocSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { t } = useTranslation('lexicalEditor')

  return (
    <aside className={`le-toc-sidebar ${collapsed ? 'le-toc-sidebar-collapsed' : ''}`}>
      <button
        className="le-toc-toggle"
        onClick={() => setCollapsed((v) => !v)}
        aria-label={collapsed ? t('toc.show') : t('toc.hide')}
      >
        {collapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
      </button>
      {!collapsed && <TableOfContentsPlugin />}
    </aside>
  )
}
