export type NotificationType = 'UPLOAD' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RESUBMIT' | 'DELETE' | 'UPDATE'

export interface Notification {
  id: number
  title: string
  message: string
  type: NotificationType
  resourceType: string
  resourceId: number | null
  isRead: boolean
  createdAt: string
  readAt: string | null
}

export interface NotificationFilters {
  page?: number
  limit?: number
}

export interface UnreadCountResponse {
  unreadCount: number
}
