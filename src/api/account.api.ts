import type { AxiosResponse } from 'axios'
import { apiClient } from './axios'
import type { AccountInfo, AccountListFilters, UpsertAccountPayload } from '../types/account.types'
import type { JsonResponse, PagedResponse } from '../types/common.types'

export const accountApi = {
  getProfile(): Promise<AxiosResponse<JsonResponse<AccountInfo>>> {
    return apiClient.get('/account/profile')
  },
  list(params: AccountListFilters): Promise<AxiosResponse<JsonResponse<PagedResponse<AccountInfo>>>> {
    return apiClient.get('/account/list', { params })
  },
  create(payload: UpsertAccountPayload): Promise<AxiosResponse<JsonResponse<AccountInfo>>> {
    return apiClient.post('/account/create', payload)
  },
  update(payload: UpsertAccountPayload): Promise<AxiosResponse<JsonResponse<AccountInfo>>> {
    return apiClient.put('/account/update', payload)
  },
  delete(ids: string[]): Promise<AxiosResponse<JsonResponse<null>>> {
    return apiClient.delete('/account/delete', { data: ids })
  },
}
