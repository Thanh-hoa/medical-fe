import type { AxiosResponse } from 'axios'
import { apiClient } from './axios'
import type { JsonResponse } from '../types/common.types'
import type {
  DashboardCountItem,
  DashboardOverview,
  DashboardStatusParams,
  DashboardTimeParams,
  DashboardTimeline,
  DashboardTimelineParams,
  UserPerformance,
} from '../types/dashboard.types'

export const dashboardApi = {
  overview(params?: DashboardTimeParams): Promise<AxiosResponse<JsonResponse<DashboardOverview>>> {
    return apiClient.get('/dashboard/overview', { params })
  },
  timeline(params: DashboardTimelineParams): Promise<AxiosResponse<JsonResponse<DashboardTimeline>>> {
    return apiClient.get('/dashboard/timeline', { params })
  },
  recordsByStatus(params?: DashboardStatusParams): Promise<AxiosResponse<JsonResponse<DashboardCountItem[]>>> {
    return apiClient.get('/dashboard/records-by-status', { params })
  },
  recordsByDepartment(params?: DashboardTimeParams): Promise<AxiosResponse<JsonResponse<DashboardCountItem[]>>> {
    return apiClient.get('/dashboard/records-by-department', { params })
  },
  userPerformance(params?: DashboardTimeParams): Promise<AxiosResponse<JsonResponse<UserPerformance[]>>> {
    return apiClient.get('/dashboard/user-performance', { params })
  },
}
