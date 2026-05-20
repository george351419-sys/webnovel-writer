import { useRef, useCallback } from 'react'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutoSaveOptions {
  onSave: () => Promise<void>
  delay?: number
  onStatusChange?: (status: SaveStatus) => void
}

export function useAutoSave({ onSave, delay = 1000, onStatusChange }: UseAutoSaveOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const trigger = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    onStatusChange?.('saving')
    timerRef.current = setTimeout(async () => {
      try {
        await onSave()
        onStatusChange?.('saved')
        setTimeout(() => onStatusChange?.('idle'), 2000)
      } catch {
        onStatusChange?.('error')
      }
    }, delay)
  }, [onSave, delay, onStatusChange])

  return { trigger }
}
