export interface Webhook {
  id: number
  url: string
  eventTypes: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface WebhookPayload {
  url: string
  eventTypes: string
  secret: string
  isActive?: boolean
}
