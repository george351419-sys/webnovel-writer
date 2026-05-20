import type { TruthFileType } from '@/types'

export const TRUTH_FILE_INFO: Record<TruthFileType, { label: string; icon: string; desc: string }> = {
  worldview:  { label: '世界观账本', icon: '🌍', desc: '世界规则、地理、历史、势力格局' },
  characters: { label: '人物矩阵',   icon: '👥', desc: '主角 / 配角 / 反派的设定与发展弧' },
  resources:  { label: '资源账本',   icon: '💎', desc: '金手指、道具、技能、货币等资产清单' },
  hooks:      { label: '悬念钩子',   icon: '🎣', desc: '已埋伏笔、未解谜题、读者期待的答案' },
  summaries:  { label: '章节摘要',   icon: '📋', desc: '每章确认后自动追加的情节摘要' },
  subplots:   { label: '支线追踪',   icon: '🔀', desc: '支线状态：进行中 / 暂停 / 已完结' },
  emotional:  { label: '情感弧线',   icon: '💕', desc: '角色间关系演变与情感进度' },
}
