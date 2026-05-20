import { X } from 'lucide-react'
import { useToastStore } from '@/store/toast'
import type { ToastType } from '@/store/toast'

const borderColor: Record<ToastType, string> = {
  success: 'border-l-ctp-green',
  error:   'border-l-ctp-red',
  warning: 'border-l-ctp-yellow',
  info:    'border-l-ctp-blue',
}

export default function Toast() {
  const { toasts, dismiss } = useToastStore()

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            w-[300px] flex items-start gap-3 px-4 py-3 rounded-lg
            bg-ctp-surface0 border border-ctp-surface1 border-l-4
            ${borderColor[toast.type]}
            shadow-lg pointer-events-auto
            animate-in slide-in-from-bottom-2 fade-in duration-200
          `}
        >
          <p className="flex-1 text-xs text-ctp-text leading-relaxed">{toast.message}</p>
          <button
            onClick={() => dismiss(toast.id)}
            className="flex-shrink-0 text-ctp-subtext0 hover:text-ctp-text transition-colors mt-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  )
}
