import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Check } from 'lucide-react'
import { useProjectsStore } from '@/store/projects'
import { useModelConfigStore } from '@/store/modelConfig'
import type { Genre } from '@/types'

interface Provider {
  label: string
  baseUrl: string
  model: string
}

const PROVIDERS: Provider[] = [
  { label: 'OpenAI',      baseUrl: 'https://api.openai.com/v1',                              model: 'gpt-4o' },
  { label: 'DeepSeek',    baseUrl: 'https://api.deepseek.com/v1',                             model: 'deepseek-chat' },
  { label: 'Kimi',        baseUrl: 'https://api.moonshot.cn/v1',                              model: 'moonshot-v1-8k' },
  { label: '智谱 GLM',    baseUrl: 'https://open.bigmodel.cn/api/paas/v4',                    model: 'glm-4-flash' },
  { label: '通义千问',    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',       model: 'qwen-plus' },
  { label: 'SiliconFlow', baseUrl: 'https://api.siliconflow.cn/v1',                           model: 'Qwen/Qwen2.5-72B-Instruct' },
]

const GENRES: { id: Genre; label: string; desc: string; color: string; bg: string }[] = [
  { id: 'xuanhuan', label: '玄幻/修仙', desc: '境界体系 · 功法修炼 · 升级流', color: 'border-ctp-mauve text-ctp-mauve', bg: 'bg-ctp-mauve/10' },
  { id: 'system',   label: '系统流',   desc: '签到系统 · 任务奖励 · 数值成长', color: 'border-ctp-blue text-ctp-blue',   bg: 'bg-ctp-blue/10' },
  { id: 'urban',    label: '都市',     desc: '打脸爽文 · 赘婿逆袭 · 商战权谋', color: 'border-ctp-green text-ctp-green',  bg: 'bg-ctp-green/10' },
  { id: 'scifi',    label: '星际/科幻', desc: '机甲战争 · 星际联邦 · 进化变异', color: 'border-ctp-sky text-ctp-sky',      bg: 'bg-ctp-sky/10' },
  { id: 'history',  label: '历史/穿越', desc: '宫廷斗争 · 穿越古代 · 科举经商', color: 'border-ctp-peach text-ctp-peach',  bg: 'bg-ctp-peach/10' },
  { id: 'romance',  label: '言情/甜宠', desc: '霸总甜宠 · 双向救赎 · 玛丽苏', color: 'border-ctp-pink text-ctp-pink',    bg: 'bg-ctp-pink/10' },
]

export default function NewProject() {
  const navigate = useNavigate()
  const createProject = useProjectsStore((s) => s.createProject)
  const { updateWriting, updateAudit, updateRevise } = useModelConfigStore()

  const [step, setStep] = useState(1)
  const [selectedGenre, setSelectedGenre] = useState<Genre | null>(null)
  const [name, setName] = useState('')
  const [creating, setCreating] = useState(false)

  // Step 3 model config state
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')

  const handleSelectProvider = (provider: Provider) => {
    setSelectedProvider(provider.label)
    setBaseUrl(provider.baseUrl)
    // Update writing/audit/revise model fields (keep temperature defaults)
    updateWriting({ baseUrl: provider.baseUrl, model: provider.model })
    updateAudit({ baseUrl: provider.baseUrl, model: provider.model })
    updateRevise({ baseUrl: provider.baseUrl, model: provider.model })
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

  return (
    <div className="h-full bg-ctp-base text-ctp-text flex flex-col overflow-hidden">
      <header className="flex items-center gap-4 px-6 py-4 border-b border-ctp-surface0 flex-shrink-0">
        <Link to="/" className="text-ctp-subtext1 hover:text-ctp-text transition-colors p-1 rounded hover:bg-ctp-surface0">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-base font-semibold">新建项目</h1>
        <div className="ml-auto flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
              s < step ? 'bg-ctp-green text-ctp-base' :
              s === step ? 'bg-ctp-mauve text-ctp-base' :
              'bg-ctp-surface1 text-ctp-subtext0'
            }`}>
              {s < step ? <Check className="w-3 h-3" /> : s}
            </div>
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8">
        {step === 1 && (
          <div>
            <h2 className="text-lg font-bold text-ctp-text mb-1">选择题材</h2>
            <p className="text-sm text-ctp-subtext1 mb-6">不同题材会注入对应的写作马具和 Prompt</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {GENRES.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGenre(g.id)}
                  className={`text-left p-4 rounded-lg border-2 transition-all duration-150 ${
                    selectedGenre === g.id
                      ? `${g.color} ${g.bg} border-current`
                      : 'border-ctp-surface1 bg-ctp-surface0 hover:border-ctp-overlay0'
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${selectedGenre === g.id ? '' : 'text-ctp-text'}`}>
                    {g.label}
                  </div>
                  <div className="text-xs text-ctp-subtext1 leading-relaxed">{g.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="max-w-sm">
            <h2 className="text-lg font-bold text-ctp-text mb-1">项目名称</h2>
            <p className="text-sm text-ctp-subtext1 mb-6">给你的网文起个好名字</p>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && name.trim() && setStep(3)}
              placeholder="例如：斗破苍穹续集"
              className="w-full bg-ctp-surface0 border border-ctp-surface1 text-ctp-text rounded-md px-4 py-3 text-sm outline-none focus:border-ctp-mauve transition-colors placeholder:text-ctp-subtext0"
            />
          </div>
        )}

        {step === 3 && (
          <div className="max-w-sm">
            <h2 className="text-lg font-bold text-ctp-text mb-1">模型配置</h2>
            <p className="text-sm text-ctp-subtext1 mb-4">选择服务商并填写 API Key，即可开启写作流水线</p>

            {/* Provider pills */}
            <div className="flex flex-wrap gap-2 mb-5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSelectProvider(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 ${
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
            <div className="flex flex-col gap-1.5 mb-3">
              <label className="text-xs font-medium text-ctp-subtext1">Base URL</label>
              <input
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://api.openai.com/v1"
                className="w-full bg-ctp-surface0 border border-ctp-surface1 text-ctp-text rounded-md px-3 py-2 text-sm outline-none focus:border-ctp-mauve transition-colors placeholder:text-ctp-subtext0"
              />
            </div>

            {/* API Key */}
            <div className="flex flex-col gap-1.5 mb-5">
              <label className="text-xs font-medium text-ctp-subtext1">API Key</label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-ctp-surface0 border border-ctp-surface1 text-ctp-text rounded-md px-3 py-2 text-sm outline-none focus:border-ctp-mauve transition-colors placeholder:text-ctp-subtext0"
              />
              <p className="text-xs text-ctp-subtext0">你的 Key 仅存储在本地浏览器</p>
            </div>
          </div>
        )}
      </main>

      <footer className="px-6 py-4 border-t border-ctp-surface0 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="px-4 py-2 text-sm text-ctp-subtext1 hover:text-ctp-text disabled:opacity-30 transition-colors"
        >
          上一步
        </button>
        {step < 3 ? (
          <button
            onClick={() => setStep((s) => s + 1)}
            disabled={step === 1 ? !selectedGenre : step === 2 ? !name.trim() : false}
            className="flex items-center gap-2 px-5 py-2 bg-ctp-mauve text-ctp-base rounded-md text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
          >
            下一步
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCreate(false)}
              disabled={creating}
              className="px-4 py-2 text-sm text-ctp-subtext1 hover:text-ctp-text disabled:opacity-30 transition-colors"
            >
              跳过，先创建项目
            </button>
            <button
              onClick={() => handleCreate(true)}
              disabled={creating}
              className="flex items-center gap-2 px-5 py-2 bg-ctp-green text-ctp-base rounded-md text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              {creating ? '创建中...' : '完成创建'}
            </button>
          </div>
        )}
      </footer>
    </div>
  )
}
