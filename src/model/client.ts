import OpenAI from 'openai'
import type { SingleModelConfig } from '@/store/modelConfig'

export function createClient(cfg: SingleModelConfig): OpenAI {
  return new OpenAI({
    baseURL: cfg.baseUrl,
    apiKey: cfg.apiKey,
    dangerouslyAllowBrowser: true,
  })
}
