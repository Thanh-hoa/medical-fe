import type { AxiosResponse } from 'axios'
import { apiClient } from './axios'
import type { PermissionMenuItem } from '../types/auth.types'
import type { JsonResponse } from '../types/common.types'

export const configApi = {
  getPermissionMenu(): Promise<AxiosResponse<JsonResponse<PermissionMenuItem[]>>> {
    return apiClient.get('/config/permission/menu')
  },
}
