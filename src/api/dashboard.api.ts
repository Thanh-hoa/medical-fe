import type { AxiosResponse } from 'axios'
import { apiClient } from './axios'
import type { JsonResponse } from '../types/common.types'
import type { DashboardCountItem, DashboardOverview, UserPerformance } from '../types/dashboard.types'

export const dashboardApi = {
  overview(): Promise<AxiosResponse<JsonResponse<DashboardOverview>>> {
    return apiClient.get('/dashboard/overview')
  },
  recordsByStatus(): Promise<AxiosResponse<JsonResponse<DashboardCountItem[]>>> {
    return apiClient.get('/dashboard/records-by-status')
  },
  recordsByDepartment(): Promise<AxiosResponse<JsonResponse<DashboardCountItem[]>>> {
    return apiClient.get('/dashboard/records-by-department')
  },
  userPerformance(): Promise<AxiosResponse<JsonResponse<UserPerformance[]>>> {
    return apiClient.get('/dashboard/user-performance')
  },
}
