import type { AxiosResponse } from 'axios'
import { apiClient, publicClient } from './axios'
import type {
  AccountInfo,
  AccountListFilters,
  RegisterAccountPayload,
  UpdateProfilePayload,
  UpsertAccountPayload,
} from '../types/account.types'
import type { JsonResponse, PagedResponse } from '../types/common.types'

export const accountApi = {
  register(payload: RegisterAccountPayload): Promise<AxiosResponse<JsonResponse<AccountInfo>>> {
    return publicClient.post('/account/register', payload)
  },
  validateToken(token: string): Promise<AxiosResponse<Omit<JsonResponse<never>, 'data'>>> {
    return publicClient.get('/account/validate-token', { params: { token } })
  },
  getProfile(): Promise<AxiosResponse<JsonResponse<AccountInfo>>> {
    return apiClient.get('/account/profile')
  },
  updateProfile(payload: UpdateProfilePayload): Promise<AxiosResponse<JsonResponse<AccountInfo>>> {
    return apiClient.put('/account/profile', payload)
  },
  getById(id: number | string): Promise<AxiosResponse<JsonResponse<AccountInfo>>> {
    return apiClient.get(`/account/${id}`)
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
  delete(ids: Array<number | string>): Promise<AxiosResponse<JsonResponse<null>>> {
    return apiClient.delete('/account/delete', { data: { account_ids: ids.map(Number) } })
  },
}
