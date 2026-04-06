import { useState, useEffect } from 'react'
import { useEditorConfig } from '../context/EditorConfigContext'
import type { MediaType } from '../types'

export function useDecoratedUrl(rawUrl: string, type: MediaType): string {
  const { decorateUrl } = useEditorConfig()
  const [url, setUrl] = useState(rawUrl)

  useEffect(() => {
    if (!decorateUrl) {
      setUrl(rawUrl)
      return
    }

    let cancelled = false
    const result = decorateUrl(rawUrl, type)

    if (typeof result === 'string') {
      setUrl(result)
    } else {
      result.then(
        (decorated) => { if (!cancelled) setUrl(decorated) },
        () => { if (!cancelled) setUrl(rawUrl) },
      )
    }

    return () => { cancelled = true }
  }, [rawUrl, type, decorateUrl])

  return url
}
