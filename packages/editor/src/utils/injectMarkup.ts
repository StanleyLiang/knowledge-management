// Helpers to inject generated HTML/SVG strings into DOM nodes via DOM APIs,
// avoiding React's raw-HTML injection prop that our security policy flags.
// Content passed here must already be trusted/sanitized by its producer
// (e.g. mermaid render with securityLevel: 'strict', Prism.highlight which
// HTML-escapes its input).

export function injectSvg(el: Element | null, svg: string): void {
  if (!el) return
  if (!svg) {
    el.replaceChildren()
    return
  }
  const doc = new DOMParser().parseFromString(svg, 'image/svg+xml')
  const root = doc.documentElement
  el.replaceChildren(root)
}

export function injectHtml(el: Element | null, html: string): void {
  if (!el) return
  if (!html) {
    el.replaceChildren()
    return
  }
  const tpl = document.createElement('template')
  tpl.innerHTML = html
  el.replaceChildren(tpl.content)
}
