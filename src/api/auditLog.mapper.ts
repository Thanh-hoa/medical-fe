import type { AuditLog } from '../types/auditLog.types'
import type { PagedResponse } from '../types/common.types'

type RawRecord = Record<string, unknown>

function asRecord(value: unknown): RawRecord {
  return value && typeof value === 'object' ? (value as RawRecord) : {}
}

function firstValue(source: RawRecord, keys: string[]) {
  for (const key of keys) {
    const value = source[key]
    if (value !== undefined && value !== null && value !== '') {
      return value
    }
  }
  return null
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toStringOrNull(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null
  return String(value)
}

export function normalizeAuditLog(raw: unknown): AuditLog {
  const source = asRecord(raw)
  const actor = asRecord(firstValue(source, ['actor', 'account', 'user', 'performedBy']))
  const request = asRecord(firstValue(source, ['request', 'metadata']))

  return {
    id: toNumber(firstValue(source, ['id', 'auditLogId', 'logId'])) ?? 0,
    actorId: toNumber(firstValue(source, ['actorId', 'accountId', 'userId', 'performedById', 'createdById']))
      ?? toNumber(firstValue(actor, ['id', 'accountId', 'userId'])),
    actorName: toStringOrNull(firstValue(source, ['actorName', 'accountName', 'userName', 'performedByName', 'createdByName']))
      ?? toStringOrNull(firstValue(actor, ['name', 'fullName', 'email', 'username'])),
    action: toStringOrNull(firstValue(source, ['action', 'eventType', 'type'])) ?? 'UNKNOWN',
    actionLabel: toStringOrNull(firstValue(source, ['actionLabel', 'label', 'description'])),
    resourceType: toStringOrNull(firstValue(source, ['resourceType', 'entityType', 'targetType'])) ?? 'UNKNOWN',
    resourceId: toNumber(firstValue(source, ['resourceId', 'entityId', 'targetId', 'medicalRecordId'])),
    oldValue: toStringOrNull(firstValue(source, ['oldValue', 'beforeValue', 'previousValue', 'oldData'])),
    newValue: toStringOrNull(firstValue(source, ['newValue', 'afterValue', 'currentValue', 'newData'])),
    ipAddress: toStringOrNull(firstValue(source, ['ipAddress', 'clientIp', 'ip', 'remoteAddr', 'remoteAddress']))
      ?? toStringOrNull(firstValue(request, ['ipAddress', 'clientIp', 'ip', 'remoteAddr', 'remoteAddress'])),
    userAgent: toStringOrNull(firstValue(source, ['userAgent', 'browser', 'agent']))
      ?? toStringOrNull(firstValue(request, ['userAgent', 'browser', 'agent'])),
    createdAt: toStringOrNull(firstValue(source, ['createdAt', 'createdDate', 'timestamp', 'loggedAt'])) ?? new Date(0).toISOString(),
  }
}

export function normalizeAuditLogPage(page: PagedResponse<unknown>): PagedResponse<AuditLog> {
  return {
    ...page,
    items: (page.items ?? []).map(normalizeAuditLog),
  }
}
