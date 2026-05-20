import { useModelConfigStore } from '@/store/modelConfig'
import { createClient } from './client'

export type ModelRole = 'writing' | 'audit' | 'revise'

export function getModelConfig(role: ModelRole) {
  const store = useModelConfigStore.getState()
  return store[role]
}

export function getClient(role: ModelRole) {
  const cfg = getModelConfig(role)
  return { client: createClient(cfg), config: cfg }
}

export async function streamCompletion(
  role: ModelRole,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  onChunk: (text: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const { client, config } = getClient(role)

  const stream = await client.chat.completions.create(
    {
      model: config.model,
      temperature: config.temperature,
      messages,
      stream: true,
    },
    { signal }
  )

  let full = ''
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? ''
    if (text) {
      full += text
      onChunk(text)
    }
  }
  return full
}

export async function completeJson<T>(
  role: ModelRole,
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
): Promise<T> {
  const { client, config } = getClient(role)

  const resp = await client.chat.completions.create({
    model: config.model,
    temperature: config.temperature,
    messages,
    response_format: { type: 'json_object' },
  })

  const text = resp.choices[0]?.message?.content ?? '{}'
  return JSON.parse(text) as T
}
