import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useModelConfigStore } from '@/store/modelConfig'
import { createClient } from '@/model/client'
import type { SingleModelConfig } from '@/store/modelConfig'

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

interface ProviderPreset {
  label: string
  baseUrl: string
  model: string
}

const PROVIDER_PRESETS: ProviderPreset[] = [
  { label: 'OpenAI',      baseUrl: 'https://api.openai.com/v1',                              model: 'gpt-4o' },
  { label: 'DeepSeek',    baseUrl: 'https://api.deepseek.com/v1',                             model: 'deepseek-chat' },
  { label: 'Kimi',        baseUrl: 'https://api.moonshot.cn/v1',                              model: 'moonshot-v1-8k' },
  { label: '智谱 GLM',    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',                    model: 'glm-4-flash' },
  { label: '通义千问',    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',       model: 'qwen-plus' },
  { label: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1',                           model: 'Qwen/Qwen2.5-72B-Instruct' },
]

interface ModelCardProps {
  title: string
  config: SingleModelConfig
  onUpdate: (cfg: Partial<SingleModelConfig>) => void
  isFirst?: boolean
  onSyncAll?: (cfg: SingleModelConfig) => void
}

function ModelCard({ title, config, onUpdate, isFirst, onSyncAll }: ModelCardProps) {
  const [showKey, setShowKey] = useState(false)
  const [local, setLocal] = useState<SingleModelConfig>({ ...config })
  const [testStatus, setTestStatus] = useState<TestStatus>('idle')
  const [testError, setTestError] = useState<string>('')
  const [activePreset, setActivePreset] = useState<string | null>(null)

  function handleChange<K extends keyof SingleModelConfig>(key: K, value: SingleModelConfig[K]) {
    setLocal((prev) => ({ ...prev, [key]: value }))
  }

  function handlePreset(preset: ProviderPreset) {
    setActivePreset(preset.label)
    setLocal((prev) => ({ ...prev, baseUrl: preset.baseUrl, model: preset.model }))
  }

  function handleSave() {
    onUpdate(local)
    if (isFirst && onSyncAll) {
      onSyncAll(local)
    }
  }

  async function handleTest() {
    setTestStatus('testing')
    setTestError('')
    try {
      const client = createClient(local)
      await client.chat.completions.create({
        model: local.model,
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 5,
      })
      setTestStatus('success')
    } catch (err) {
      setTestStatus('error')
      setTestError(err instanceof Error ? err.message : String(err))
    } finally {
      setTimeout(() => {
        setTestStatus('idle')
        setTestError('')
      }, 3000)
    }
  }

  const testButtonClass = (() => {
    if (testStatus === 'success') return 'bg-ctp-green/20 text-ctp-green border-ctp-green/40'
    if (testStatus === 'error') return 'bg-ctp-red/20 text-ctp-red border-ctp-red/40'
    return 'bg-ctp-surface1 text-ctp-subtext1 border-ctp-surface1 hover:bg-ctp-surface0 hover:text-ctp-text'
  })()

  const testButtonLabel = (() => {
    if (testStatus === 'testing') return '测试中...'
    if (testStatus === 'success') return '✓ 连接成功'
    if (testStatus === 'error') return '✗ 连接失败'
    return '测试连通性'
  })()

  return (
    <div className="bg-ctp-surface0 rounded-xl p-5 flex flex-col gap-4">
      <h2 className="text-sm font-semibold text-ctp-mauve">{title}</h2>

      {/* Provider presets */}
      <div className="flex flex-wrap gap-1.5">
        {PROVIDER_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => handlePreset(p)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 ${
              activePreset === p.label
                ? 'bg-ctp-mauve text-ctp-base border-ctp-mauve'
                : 'bg-ctp-base text-ctp-subtext1 border-ctp-surface1 hover:border-ctp-mauve hover:text-ctp-text'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Base URL */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-ctp-subtext1">Base URL</label>
        <input
          type="text"
          value={local.baseUrl}
          onChange={(e) => handleChange('baseUrl', e.target.value)}
          placeholder="https://api.openai.com/v1"
          className="w-full px-3 py-2 rounded-md bg-ctp-base border border-ctp-surface1 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:border-ctp-mauve transition-colors"
        />
      </div>

      {/* API Key */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-ctp-subtext1">API Key</label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={local.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            placeholder="sk-..."
            className="w-full px-3 py-2 pr-10 rounded-md bg-ctp-base border border-ctp-surface1 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:border-ctp-mauve transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ctp-overlay0 hover:text-ctp-subtext1 transition-colors"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Model */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-ctp-subtext1">模型名称</label>
        <input
          type="text"
          value={local.model}
          onChange={(e) => handleChange('model', e.target.value)}
          placeholder="如 gpt-4o"
          className="w-full px-3 py-2 rounded-md bg-ctp-base border border-ctp-surface1 text-sm text-ctp-text placeholder-ctp-overlay0 focus:outline-none focus:border-ctp-mauve transition-colors"
        />
      </div>

      {/* Temperature */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-ctp-subtext1">Temperature</label>
          <span className="text-xs font-mono text-ctp-text">{local.temperature.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min={0}
          max={1}
          step={0.1}
          value={local.temperature}
          onChange={(e) => handleChange('temperature', parseFloat(e.target.value))}
          className="w-full accent-ctp-mauve"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <div className="relative group">
          <button
            type="button"
            onClick={handleTest}
            disabled={testStatus === 'testing'}
            className={`px-3 py-1.5 text-xs rounded-md border transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${testButtonClass}`}
          >
            {testButtonLabel}
          </button>
          {testStatus === 'error' && testError && (
            <div className="absolute bottom-full left-0 mb-1.5 w-64 px-3 py-2 bg-ctp-crust border border-ctp-red/40 rounded-md text-xs text-ctp-red shadow-lg z-10 whitespace-pre-wrap break-all">
              {testError}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          className="ml-auto px-4 py-1.5 text-xs rounded-md bg-ctp-mauve text-ctp-base font-medium hover:bg-ctp-mauve/80 transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  )
}

export default function Settings() {
  const { writing, audit, revise, updateWriting, updateAudit, updateRevise } =
    useModelConfigStore()
  const [syncToast, setSyncToast] = useState(false)

  function handleSyncAll(cfg: SingleModelConfig) {
    updateAudit({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, model: cfg.model, temperature: 0.3 })
    updateRevise({ baseUrl: cfg.baseUrl, apiKey: cfg.apiKey, model: cfg.model, temperature: 0.5 })
    setSyncToast(true)
    setTimeout(() => setSyncToast(false), 3000)
  }

  return (
    <div className="h-full bg-ctp-base text-ctp-text flex flex-col">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-ctp-surface0 flex-shrink-0">
        <Link
          to="/"
          className="text-ctp-subtext1 hover:text-ctp-text transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-lg font-semibold">模型设置</h1>
      </header>

      <main className="flex-1 overflow-y-auto py-8">
        <div className="max-w-2xl mx-auto px-6 flex flex-col gap-6">
          {syncToast && (
            <div className="px-4 py-2.5 rounded-lg bg-ctp-green/10 border border-ctp-green/30 text-xs text-ctp-green">
              已同步 API 配置到审稿/修订模型（温度独立保留）
            </div>
          )}
          <ModelCard
            title="写作模型"
            config={writing}
            onUpdate={updateWriting}
            isFirst={true}
            onSyncAll={handleSyncAll}
          />
          <ModelCard
            title="审稿模型"
            config={audit}
            onUpdate={updateAudit}
          />
          <ModelCard
            title="修订模型"
            config={revise}
            onUpdate={updateRevise}
          />
        </div>
      </main>
    </div>
  )
}
