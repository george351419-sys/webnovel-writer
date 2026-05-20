export interface AuditDimension {
  id: string
  name: string
  group: string
  description: string
}

export const AUDIT_DIMENSIONS: AuditDimension[] = [
  // 爽感节奏（7个）
  {
    id: 'satisfaction_density',
    name: '爽点密度',
    group: '爽感节奏',
    description: '检查本章中爽点（主角得到认可、反击成功、获得资源等）的分布密度是否合理，是否让读者持续保持兴奋感',
  },
  {
    id: 'pacing_control',
    name: '节奏把控',
    group: '爽感节奏',
    description: '评估章节的整体节奏是否张弛有度，快慢切换是否自然流畅，不拖沓也不过于仓促',
  },
  {
    id: 'climax_design',
    name: '高潮设计',
    group: '爽感节奏',
    description: '检查章节高潮时刻是否设计得足够震撼、情绪冲击力是否强烈，读者是否能感受到明显的情感峰值',
  },
  {
    id: 'suspense_hook',
    name: '悬念留钩',
    group: '爽感节奏',
    description: '评估章节结尾是否留有吸引读者继续阅读的悬念或钩子，能否有效驱动读者翻章',
  },
  {
    id: 'chapter_completeness',
    name: '章节完整性',
    group: '爽感节奏',
    description: '检查本章是否有清晰的开头、发展和结尾，是否构成一个相对独立的叙事单元',
  },
  {
    id: 'emotional_fluctuation',
    name: '情绪起伏',
    group: '爽感节奏',
    description: '评估读者情绪在阅读过程中是否有足够的起伏变化，避免情绪平铺直叙导致阅读疲劳',
  },
  {
    id: 'face_slap_effect',
    name: '打脸效果',
    group: '爽感节奏',
    description: '检查打脸、逆转、反转等情节的设计是否令人满足，前因后果是否清晰，读者是否能感受到强烈的爽感',
  },

  // 人物塑造（6个）
  {
    id: 'protagonist_consistency',
    name: '主角行为一致性',
    group: '人物塑造',
    description: '检查主角的行为、决策是否与其性格设定保持一致，是否有前后矛盾或突兀的行为表现',
  },
  {
    id: 'supporting_functionality',
    name: '配角功能性',
    group: '人物塑造',
    description: '评估配角在本章中是否发挥了明确的叙事功能（推动剧情、衬托主角、提供信息等），是否存在可有可无的角色',
  },
  {
    id: 'dialogue_naturalness',
    name: '对白自然度',
    group: '人物塑造',
    description: '检查人物对白是否自然流畅，是否符合各角色的身份、性格和当时情境，避免台词过于书面化或刻意',
  },
  {
    id: 'emotional_authenticity',
    name: '情感真实性',
    group: '人物塑造',
    description: '评估人物在关键时刻的情感反应是否真实可信，能否引发读者共鸣，避免情感表达过于夸张或空洞',
  },
  {
    id: 'character_motivation',
    name: '人物动机',
    group: '人物塑造',
    description: '检查各主要人物的行动动机是否清晰合理，读者是否能理解为什么角色会做出这些选择',
  },
  {
    id: 'growth_arc',
    name: '成长弧线',
    group: '人物塑造',
    description: '评估主角在本章中是否有可见的成长变化（能力提升、认知改变、心态转变等），是否推进了整体成长弧',
  },

  // 情节逻辑（6个）
  {
    id: 'cause_effect',
    name: '因果逻辑',
    group: '情节逻辑',
    description: '检查情节发展是否有清晰的因果链条，事件的发生是否有充分铺垫，避免剧情突兀或强行推进',
  },
  {
    id: 'foreshadowing',
    name: '伏笔铺垫',
    group: '情节逻辑',
    description: '评估本章中伏笔的设置与前章伏笔的回收是否自然合理，是否做到了有埋有收',
  },
  {
    id: 'plot_advancement',
    name: '情节推进速度',
    group: '情节逻辑',
    description: '检查情节推进的速度是否适当，既不过于拖沓（水字数），也不过于跳跃（缺乏过渡）',
  },
  {
    id: 'conflict_design',
    name: '冲突设计',
    group: '情节逻辑',
    description: '评估本章核心冲突是否设计合理，冲突的规模和强度是否与故事阶段相匹配，是否能制造足够的戏剧张力',
  },
  {
    id: 'resolution_reasonableness',
    name: '解决合理性',
    group: '情节逻辑',
    description: '检查冲突或问题的解决方式是否合理，主角的解决手段是否在其能力范围内，避免开挂式强行解决',
  },
  {
    id: 'subplot_advancement',
    name: '支线推进',
    group: '情节逻辑',
    description: '评估本章是否合理推进了相关支线剧情，支线与主线的交织是否自然，不喧宾夺主',
  },

  // 世界观一致（6个）
  {
    id: 'setting_consistency',
    name: '设定自洽性',
    group: '世界观一致',
    description: '检查本章中涉及的世界设定是否与已建立的世界观保持一致，是否有自相矛盾的内容',
  },
  {
    id: 'power_system_consistency',
    name: '力量体系一致',
    group: '世界观一致',
    description: '评估本章中角色的能力表现是否符合已建立的力量体系规则，不能随意升级或忽视已有限制',
  },
  {
    id: 'geography_environment',
    name: '地理环境',
    group: '世界观一致',
    description: '检查地理位置、环境描写是否与前文描述一致，角色的移动距离和时间是否合理',
  },
  {
    id: 'timeline_coherence',
    name: '时间线连贯',
    group: '世界观一致',
    description: '评估本章的时间线是否连贯，时间流逝是否合理，是否存在时间跳跃或矛盾',
  },
  {
    id: 'cultural_background',
    name: '文化背景',
    group: '世界观一致',
    description: '检查本章中涉及的文化、礼仪、社会规范是否符合故事所设定的文化背景，不能随意引入不符合背景的文化元素',
  },
  {
    id: 'data_numerical_consistency',
    name: '数据数值自洽',
    group: '世界观一致',
    description: '评估章节中出现的各类数值（修为等级、战斗力、金钱数量等）是否与前文保持一致，是否有明显的数据矛盾',
  },

  // 写作技巧（8个）
  {
    id: 'description_detail',
    name: '描写细腻度',
    group: '写作技巧',
    description: '检查场景、动作、心理等描写是否足够细腻生动，是否能让读者产生代入感和画面感',
  },
  {
    id: 'pov_consistency',
    name: '视角一致性',
    group: '写作技巧',
    description: '评估叙事视角是否保持一致，是否存在视角混乱（第三人称中突然出现其他人物的主观感受等）',
  },
  {
    id: 'narrative_clarity',
    name: '叙述清晰度',
    group: '写作技巧',
    description: '检查叙述是否清晰易懂，逻辑是否流畅，读者是否能轻松理解正在发生的事情',
  },
  {
    id: 'paragraph_structure',
    name: '段落结构',
    group: '写作技巧',
    description: '评估段落划分是否合理，段落长度是否适中，是否有利于阅读节奏，避免超长段落或过碎的段落',
  },
  {
    id: 'word_accuracy',
    name: '用词准确度',
    group: '写作技巧',
    description: '检查用词是否准确恰当，是否存在用词不当、语义模糊或错别字等问题',
  },
  {
    id: 'forbidden_words',
    name: '禁忌词检测',
    group: '写作技巧',
    description: '检测是否包含平台禁忌词、敏感词或不当内容，确保内容符合主流网文平台的发布规范',
  },
  {
    id: 'repetitive_expression',
    name: '重复表达',
    group: '写作技巧',
    description: '检查是否存在短距离内重复使用相同词汇、句式或表达方式的情况，影响阅读体验',
  },
  {
    id: 'information_density',
    name: '信息密度',
    group: '写作技巧',
    description: '评估章节信息密度是否合理，是否存在大量无效信息（水词）或关键信息过于密集导致难以消化',
  },
]
