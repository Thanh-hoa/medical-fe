import type { AxiosResponse } from 'axios'
import { apiClient } from './axios'
import { normalizeAuditLog, normalizeAuditLogPage } from './auditLog.mapper'
import type { AuditLog, AuditLogFilters } from '../types/auditLog.types'
import type { JsonResponse, PagedResponse } from '../types/common.types'

export const auditLogApi = {
  async list(params: AuditLogFilters): Promise<AxiosResponse<JsonResponse<PagedResponse<AuditLog>>>> {
    const response = await apiClient.get<JsonResponse<PagedResponse<unknown>>>('/audit-logs', { params })
    return {
      ...response,
      data: {
        ...response.data,
        data: normalizeAuditLogPage(response.data.data),
      },
    }
  },
  async detail(id: number | string): Promise<AxiosResponse<JsonResponse<AuditLog>>> {
    const response = await apiClient.get<JsonResponse<unknown>>(`/audit-logs/${id}`)
    return {
      ...response,
      data: {
        ...response.data,
        data: normalizeAuditLog(response.data.data),
      },
    }
  },
}
