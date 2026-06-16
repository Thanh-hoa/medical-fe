export interface AuditLog {
  id: number
  actorId: number | null
  actorName: string | null
  action: string
  actionLabel: string | null
  resourceType: string
  resourceId: number | null
  oldValue: string | null
  newValue: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export interface AuditLogFilters {
  page?: number
  limit?: number
  resourceType?: string
  actorId?: number
  action?: string
}
