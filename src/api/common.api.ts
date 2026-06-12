import type { AxiosResponse } from 'axios'
import { apiClient } from './axios'
import type { RoleInfo } from '../types/account.types'
import type { JsonResponse, UploadMediaResponse } from '../types/common.types'

export const commonApi = {
  uploadMedia(file: File): Promise<AxiosResponse<JsonResponse<UploadMediaResponse>>> {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.post('/common/upload/media', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  getRoles(): Promise<AxiosResponse<JsonResponse<RoleInfo[]>>> {
    return apiClient.get('/common/roles')
  },
}
