import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useEffect } from 'react'
import { COMMAND_PRIORITY_HIGH, PASTE_COMMAND } from 'lexical'
import { UPLOAD_IMAGE_COMMAND } from './InsertCommands'

export function PastePlugin() {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    return editor.registerCommand(
      PASTE_COMMAND,
      (event: ClipboardEvent) => {
        const clipboardData = event.clipboardData
        if (!clipboardData) return false

        // 1. Check for image files in clipboard (e.g. screenshot paste)
        const imageFiles: File[] = []
        for (let i = 0; i < clipboardData.files.length; i++) {
          const file = clipboardData.files[i]
          if (file.type.startsWith('image/')) {
            imageFiles.push(file)
          }
        }

        if (imageFiles.length > 0) {
          event.preventDefault()
          for (const file of imageFiles) {
            editor.dispatchCommand(UPLOAD_IMAGE_COMMAND, file)
          }
          return true
        }

        // 2. Check for HTML content with external images
        const html = clipboardData.getData('text/html')
        if (html) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')
          const imgs = doc.querySelectorAll('img[src]')

          // Only intercept if there are external images to process
          const externalImgUrls: string[] = []
          imgs.forEach((img) => {
            const src = img.getAttribute('src')
            if (src && !src.startsWith('data:')) {
              externalImgUrls.push(src)
            }
          })

          if (externalImgUrls.length > 0) {
            // Let Lexical handle the text/HTML paste normally first
            // Then fetch and upload the external images asynchronously
            setTimeout(() => {
              for (const url of externalImgUrls) {
                fetchImageAsFile(url).then((file) => {
                  if (file) {
                    editor.dispatchCommand(UPLOAD_IMAGE_COMMAND, file)
                  }
                })
              }
            }, 0)
            // Return false to let Lexical handle the rest of the HTML
            return false
          }
        }

        // 3. Let Lexical handle everything else (text, internal node JSON, etc.)
        return false
      },
      COMMAND_PRIORITY_HIGH,
    )
  }, [editor])

  return null
}

async function fetchImageAsFile(url: string): Promise<File | null> {
  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const blob = await response.blob()
    if (!blob.type.startsWith('image/')) return null

    const ext = blob.type.split('/')[1] || 'png'
    return new File([blob], `pasted-image.${ext}`, { type: blob.type })
  } catch {
    // CORS or network error — skip this image
    console.warn('[PastePlugin] Failed to fetch external image:', url)
    return null
  }
}
