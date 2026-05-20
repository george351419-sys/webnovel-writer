import { completeJson } from '@/model/router'

interface FingerprintResponse {
  fingerprint: string
}

export async function extractStyleFingerprint(sampleText: string): Promise<string> {
  const result = await completeJson<FingerprintResponse>('writing', [
    {
      role: 'system',
      content:
        '你是一位专业的文学风格分析师，善于从文本中提炼作者的写作风格特征，并用简练的中文描述。',
    },
    {
      role: 'user',
      content: `请分析以下文本的写作风格特征，输出 JSON 格式：
{
  "fingerprint": "一段200字以内的风格描述，包含：句式偏好（长句/短句/混合）、词汇选择（文艺/白话/网文感）、叙事节奏（快节奏/慢热/张弛有度）、特色表达习惯、情感基调"
}

参考文本：
${sampleText}`,
    },
  ])

  return result.fingerprint ?? ''
}
