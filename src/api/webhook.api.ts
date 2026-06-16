import type { AxiosResponse } from 'axios'
import { apiClient } from './axios'
import type { Webhook, WebhookPayload } from '../types/webhook.types'

export const webhookApi = {
  list(): Promise<AxiosResponse<Webhook[]>> {
    return apiClient.get('/admin/webhooks')
  },
  detail(id: number): Promise<AxiosResponse<Webhook>> {
    return apiClient.get(`/admin/webhooks/${id}`)
  },
  create(payload: WebhookPayload): Promise<AxiosResponse<Webhook>> {
    return apiClient.post('/admin/webhooks', payload)
  },
  update(id: number, payload: Partial<WebhookPayload>): Promise<AxiosResponse<Webhook>> {
    return apiClient.put(`/admin/webhooks/${id}`, payload)
  },
  remove(id: number): Promise<AxiosResponse<void>> {
    return apiClient.delete(`/admin/webhooks/${id}`)
  },
}
