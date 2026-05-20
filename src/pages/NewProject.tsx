import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff } from 'lucide-react'
import { useProjectsStore } from '@/store/projects'
import { useModelConfigStore } from '@/store/modelConfig'
import type { Genre } from '@/types'

interface Provider { label: string; baseUrl: string; model: string }

const PROVIDERS: Provider[] = [
  { label: 'OpenAI',      baseUrl: 'https://api.openai.com/v1',                             model: 'gpt-4o' },
  { label: 'DeepSeek',    baseUrl: 'https://api.deepseek.com/v1',                            model: 'deepseek-chat' },
  { label: 'Kimi',        baseUrl: 'https://api.moonshot.cn/v1',                             model: 'moonshot-v1-8k' },
  { label: '智谱 GLM',    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',                   model: 'glm-4-flash' },
  { label: '通义千问',    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',      model: 'qwen-plus' },
  { label: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1',                          model: 'Qwen/Qwen2.5-72B-Instruct' },
]

const GENRES: { id: Genre; label: string; desc: string; color: string; bg: string }[] = [
  { id: 'xuanhuan', label: '玄幻/修仙', desc: '境界体系 · 功法修炼 · 升级流', color: 'border-ctp-mauve text-ctp-mauve', bg: 'bg-ctp-mauve/10' },
  { id: 'system',   label: '系统流',   desc: '签到系统 · 任务奖励 · 数值成长', color: 'border-ctp-blue text-ctp-blue',   bg: 'bg-ctp-blue/10' },
  { id: 'urban',    label: '都市',     desc: '打脸爽文 · 赘婿逆袭 · 商战权谋', color: 'border-ctp-green text-ctp-green',  bg: 'bg-ctp-green/10' },
  { id: 'scifi',    label: '星际/科幻', desc: '机甲战争 · 星际联邦 · 进化变异', color: 'border-ctp-sky text-ctp-sky',      bg: 'bg-ctp-sky/10' },
  { id: 'history',  label: '历史/穿越', desc: '宫廷斗争 · 穿越古代 · 科举经商', color: 'border-ctp-peach text-ctp-peach',  bg: 'bg-ctp-peach/10' },
  { id: 'romance',  label: '言情/甜宠', desc: '霸总甜宠 · 双向救赎 · 玛丽苏',  color: 'border-ctp-pink text-ctp-pink',    bg: 'bg-ctp-pink/10' },
]

export default function NewProject() {
  const navigate = useNavigate()
  const createProject = useProjectsStore((s) => s.createProject)
  const { updateWriting, updateAudit, updateRevise, isConfigured } = useModelConfigStore()

  const alreadyConfigured = isConfigured()
  const totalSteps = alreadyConfigured ? 2 : 3

  const [step, setStep] = useState(1)
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  const handleSelectProvider = (p: Provider) => {
    setSelectedProvider(p.label)
    setBaseUrl(p.baseUrl)
    updateWriting({ baseUrl: p.baseUrl, model: p.model })
    updateAudit({ baseUrl: p.baseUrl, model: p.model })
    updateRevise({ baseUrl: p.baseUrl, model: p.model })
  }

  const handleCreate = async (saveConfig = false) => {
    if (!selectedGenre || !name.trim()) return
    if (saveConfig && apiKey.trim()) {
      updateWriting({ baseUrl, apiKey: apiKey.trim() })
      updateAudit({ baseUrl, apiKey: apiKey.trim() })
      updateRevise({ baseUrl, apiKey: apiKey.trim() })
    }
    setCreating(true)
    try {
      const project = await createProject(name.trim(), selectedGenre)
      navigate(`/project/${project.uid}`)
    } finally {
      setCreating(false)
    }
  }

  const handleNext = () => {
    if (step === 1 && selectedGenre) setStep(2)
    else if (step === 2 && name.trim()) {
      if (alreadyConfigured) handleCreate(false)
      else setStep(3)
    }
  }

  const canNext = step === 1 ? !!selectedGenre : step === 2 ? !!name.trim() : false

  return (
    <div className="h-full bg-ctp-base flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-ctp-mantle rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-ctp-surface0">
          <Link to="/" className="text-ctp-subtext1 hover:text-ctp-text transition-colors p-1.5 rounded-lg hover:bg-ctp-surface0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-base font-semibold text-ctp-text flex-1">新建项目</h1>
          {/* Step indicators */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
              <div key={s} className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold transition-colors ${
                s < step ? 'bg-ctp-green text-ctp-base' :
                s === step ? 'bg-ctp-mauve text-ctp-base' :
                'bg-ctp-surface1 text-ctp-subtext0'
              }`}>
                {s < step ? <Check className="w-3 h-3" /> : s}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 px-6 py-8">

          {/* Step 1: Genre */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-ctp-text mb-1 text-center">选择题材</h2>
              <p className="text-sm text-ctp-subtext1 mb-6 text-center">不同题材会注入对应的写作风格和 Prompt</p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {GENRES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGenre(g.id)}
                    className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                      selectedGenre === g.id
                        ? `${g.color} ${g.bg} border-current`
                        : 'border-ctp-surface1 bg-ctp-surface0 hover:border-ctp-overlay0'
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-1 ${selectedGenre === g.id ? '' : 'text-ctp-text'}`}>{g.label}</div>
                    <div className="text-xs text-ctp-subtext1 leading-relaxed">{g.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Name */}
          {step === 2 && (
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-bold text-ctp-text mb-1">给你的故事起个名字</h2>
              <p className="text-sm text-ctp-subtext1 mb-8">之后可以随时修改</p>
              <input
                autoFocus
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleNext()}
                placeholder="例如：斗破苍穹续集"
                className="w-full bg-ctp-surface0 border border-ctp-surface1 text-ctp-text rounded-xl px-4 py-3.5 text-base outline-none focus:border-ctp-mauve transition-colors placeholder:text-ctp-subtext0 text-center"
              />
              {alreadyConfigured && (
                <p className="mt-4 text-xs text-ctp-green flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  已有模型配置，点击「创建」直接开始
                </p>
              )}
            </div>
          )}

          {/* Step 3: Model config (only shown when not configured) */}
          {step === 3 && (
            <div className="flex flex-col items-center">
              <h2 className="text-xl font-bold text-ctp-text mb-1">配置 AI 模型</h2>
              <p className="text-sm text-ctp-subtext1 mb-6">选择服务商，填写 API Key 开启 AI 写作</p>

              <div className="w-full space-y-5">
                {/* Provider pills */}
                <div className="flex flex-wrap justify-center gap-2">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSelectProvider(p)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        selectedProvider === p.label
                          ? 'bg-ctp-mauve text-ctp-base border-ctp-mauve'
                          : 'bg-ctp-surface0 text-ctp-subtext1 border-ctp-surface1 hover:border-ctp-mauve hover:text-ctp-text'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {/* Base URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ctp-subtext1 text-center">Base URL</label>
                  <input
                    type="text"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="w-full bg-ctp-surface0 border border-ctp-surface1 text-ctp-text rounded-xl px-4 py-3 text-sm outline-none focus:border-ctp-mauve transition-colors placeholder:text-ctp-subtext0"
                  />
                </div>

                {/* API Key */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-ctp-subtext1 text-center">API Key</label>
                  <div className="relative">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-..."
                      className="w-full bg-ctp-surface0 border border-ctp-surface1 text-ctp-text rounded-xl px-4 py-3 pr-10 text-sm outline-none focus:border-ctp-mauve transition-colors placeholder:text-ctp-subtext0"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ctp-overlay0 hover:text-ctp-subtext1 transition-colors"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-ctp-subtext0 text-center">Key 仅存储在本地浏览器，不经过任何服务器</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-ctp-surface0 flex items-center justify-between">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className="px-4 py-2 text-sm text-ctp-subtext1 hover:text-ctp-text disabled:opacity-0 transition-colors"
          >
            上一步
          </button>

          <div className="flex items-center gap-3">
            {step === 3 && (
              <button
                onClick={() => handleCreate(false)}
                disabled={creating}
                className="px-4 py-2 text-sm text-ctp-subtext1 hover:text-ctp-text disabled:opacity-30 transition-colors"
              >
                跳过
              </button>
            )}
            <button
              onClick={step < totalSteps ? handleNext : () => handleCreate(step === 3)}
              disabled={creating || (step < 3 && !canNext)}
              className="flex items-center gap-2 px-6 py-2.5 bg-ctp-mauve text-ctp-base rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {creating ? '创建中...' : step === totalSteps ? (
                <><Check className="w-4 h-4" /> 创建项目</>
              ) : (
                <>下一步 <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
