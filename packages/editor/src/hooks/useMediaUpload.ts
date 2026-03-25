import { useState, useCallback } from 'react'
import type { OnUpload, MediaType, MediaUploadResult } from '../types'

export type UploadState =
  | { status: 'initial' }
  | { status: 'uploading' }
  | { status: 'converting' }
  | { status: 'success'; result: MediaUploadResult }
  | { status: 'error'; message: string }

export function useMediaUpload(onUpload?: OnUpload) {
  const [state, setState] = useState<UploadState>({ status: 'initial' })

  const upload = useCallback(
    async (file: File, type: MediaType) => {
      if (onUpload) {
        setState({ status: 'uploading' })
        try {
          const result = await onUpload(file, type, (mediaStatus) => {
            setState({ status: mediaStatus })
          })
          setState({ status: 'success', result })
          return result
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Upload failed'
          setState({ status: 'error', message })
          return null
        }
      } else {
        // Default: convert to data URL
        setState({ status: 'uploading' })
        return new Promise<MediaUploadResult | null>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => {
            const url = reader.result as string
            const result: MediaUploadResult = {
              url,
              fileName: file.name,
              fileSize: file.size,
              mimeType: file.type,
            }
            setState({ status: 'success', result })
            resolve(result)
          }
          reader.onerror = () => {
            setState({ status: 'error', message: 'Failed to read file' })
            resolve(null)
          }
          reader.readAsDataURL(file)
        })
      }
    },
    [onUpload],
  )

  const retry = useCallback(
    (file: File, type: MediaType) => {
      setState({ status: 'initial' })
      return upload(file, type)
    },
    [upload],
  )

  return { state, upload, retry, setState }
}
