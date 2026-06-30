import type { AxiosResponse } from 'axios'
import { apiClient } from './axios'
import type { Notification, NotificationFilters, UnreadCountResponse } from '../types/notification.types'
import type { PagedResponse } from '../types/common.types'

export const notificationApi = {
  list(params?: NotificationFilters): Promise<AxiosResponse<PagedResponse<Notification>>> {
    return apiClient.get('/notifications', { params })
  },
  unreadCount(): Promise<AxiosResponse<UnreadCountResponse>> {
    return apiClient.get('/notifications/unread-count')
  },
  markRead(id: number): Promise<AxiosResponse<void>> {
    return apiClient.put(`/notifications/${id}/read`)
  },
  markAllRead(): Promise<AxiosResponse<void>> {
    return apiClient.put('/notifications/read-all')
  },
  remove(id: number): Promise<AxiosResponse<void>> {
    return apiClient.delete(`/notifications/${id}`)
  },
}
