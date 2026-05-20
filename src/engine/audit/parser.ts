import type { AuditIssue, AuditSeverity } from '@/types'

const VALID_SEVERITIES: AuditSeverity[] = ['high', 'medium', 'low']

function isSeverity(value: unknown): value is AuditSeverity {
  return typeof value === 'string' && (VALID_SEVERITIES as string[]).includes(value)
}

function parseIssue(item: unknown): AuditIssue | null {
  if (typeof item !== 'object' || item === null) return null

  const record = item as Record<string, unknown>

  const dimension = typeof record['dimension'] === 'string' ? record['dimension'] : ''
  const severity = isSeverity(record['severity']) ? record['severity'] : 'low'
  const description = typeof record['description'] === 'string' ? record['description'] : ''
  const suggestion = typeof record['suggestion'] === 'string' ? record['suggestion'] : ''

  if (!dimension || !description) return null

  return {
    dimension,
    severity,
    description,
    suggestion,
    resolved: false,
  }
}

export function parseAuditResponse(raw: unknown): AuditIssue[] {
  try {
    let items: unknown[]

    if (Array.isArray(raw)) {
      items = raw
    } else if (typeof raw === 'object' && raw !== null) {
      const record = raw as Record<string, unknown>
      if (Array.isArray(record['issues'])) {
        items = record['issues']
      } else {
        return []
      }
    } else {
      return []
    }

    const issues: AuditIssue[] = []
    for (const item of items) {
      const parsed = parseIssue(item)
      if (parsed !== null) {
        issues.push(parsed)
      }
    }
    return issues
  } catch {
    return []
  }
}
