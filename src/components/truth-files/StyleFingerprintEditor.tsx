import { useState } from 'react'
import { Fingerprint, X, Loader2 } from 'lucide-react'
import { extractStyleFingerprint } from '@/engine/style/fingerprint'

interface Props {
  projectUid: string
  currentFingerprint?: string
  onUpdate: (fingerprint: string) => void
}

export default function StyleFingerprintEditor({ currentFingerprint, onUpdate }: Props) {
  const [sampleText, setSampleText] = useState('')
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null,
  )

  async function handleExtract() {
    const trimmed = sampleText.trim()
    if (!trimmed) return
    setLoading(true)
    setFeedback(null)
    try {
      const fingerprint = await extractStyleFingerprint(trimmed)
      onUpdate(fingerprint)
      setSampleText('')
      setFeedback({ type: 'success', message: '风格指纹提取成功！' })
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : '提取失败，请检查模型配置',
      })
    } finally {
      setLoading(false)
      setTimeout(() => setFeedback(null), 4000)
    }
  }

  function handleClear() {
    onUpdate('')
  }

  return (
    <div className="flex-1 flex flex-col bg-ctp-base overflow-hidden">
      {/* Header */}
      <div className="px-6 py-3 border-b border-ctp-surface0 flex items-center gap-2 flex-shrink-0">
        <Fingerprint className="w-4 h-4 text-ctp-mauve flex-shrink-0" />
        <div>
          <h2 className="text-sm font-medium text-ctp-text">风格指纹</h2>
          <p className="text-xs text-ctp-subtext0">从参考文本中提取你的写作风格，注入到 AI 创作中</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
        {/* Current fingerprint display */}
        {currentFingerprint && (
          <div className="relative rounded-lg bg-ctp-surface0 border border-ctp-surface1 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-ctp-mauve">当前风格指纹</span>
              <button
                type="button"
                onClick={handleClear}
                className="flex-shrink-0 text-ctp-overlay0 hover:text-ctp-red transition-colors"
                title="清除风格指纹"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-sm text-ctp-text leading-relaxed whitespace-pre-wrap">
              {currentFingerprint}
            </p>
          </div>
        )}

        {/* Upload / extract area */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-medium text-ctp-subtext1">
            粘贴参考文本（建议 500-2000 字）
          </label>
          <textarea
            value={sampleText}
            onChange={(e) => setSampleText(e.target.value)}
            placeholder="粘贴 500-2000 字的参考文本，AI 将提取你的写作风格特征..."
            rows={8}
            className="w-full px-3 py-2.5 rounded-md bg-ctp-surface0 border border-ctp-surface1 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:border-ctp-mauve transition-colors resize-none leading-relaxed"
          />
          <button
            type="button"
            onClick={handleExtract}
            disabled={loading || !sampleText.trim()}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-ctp-mauve text-ctp-base text-sm font-medium hover:bg-ctp-mauve/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>提取中...</span>
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4" />
                <span>提取风格</span>
              </>
            )}
          </button>
        </div>

        {/* Status feedback */}
        {feedback && (
          <div
            className={`px-3 py-2 rounded-md text-xs ${
              feedback.type === 'success'
                ? 'bg-ctp-green/10 text-ctp-green border border-ctp-green/30'
                : 'bg-ctp-red/10 text-ctp-red border border-ctp-red/30'
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>
    </div>
  )
}
