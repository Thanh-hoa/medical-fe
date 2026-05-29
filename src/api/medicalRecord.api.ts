import type { AxiosResponse } from 'axios'
import { apiClient } from './axios'
import type { JsonResponse, PagedResponse } from '../types/common.types'
import type {
  MedicalRecordDetail,
  MedicalRecordListFilters,
  MedicalRecordSummary,
  RejectMedicalRecordPayload,
  UpdateMedicalRecordFieldPayload,
} from '../types/medicalRecord.types'

export const medicalRecordApi = {
  upload(file: File): Promise<AxiosResponse<JsonResponse<MedicalRecordDetail>>> {
    const formData = new FormData()
    formData.append('file', file)

    return apiClient.post('/medical-record/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  list(
    params: MedicalRecordListFilters,
  ): Promise<AxiosResponse<JsonResponse<PagedResponse<MedicalRecordSummary>>>> {
    return apiClient.get('/medical-record/list', { params })
  },
  detail(id: number | string): Promise<AxiosResponse<JsonResponse<MedicalRecordDetail>>> {
    return apiClient.get(`/medical-record/${id}`)
  },
  updateDetail(payload: MedicalRecordDetail): Promise<AxiosResponse<JsonResponse<MedicalRecordDetail>>> {
    return apiClient.put('/medical-record/update-detail', payload)
  },
  updateField(payload: UpdateMedicalRecordFieldPayload): Promise<AxiosResponse<JsonResponse<null>>> {
    return apiClient.put('/medical-record/field/update', payload)
  },
  submit(id: number): Promise<AxiosResponse<JsonResponse<MedicalRecordSummary>>> {
    return apiClient.put(`/medical-record/${id}/submit`)
  },
  approve(id: number): Promise<AxiosResponse<JsonResponse<MedicalRecordSummary>>> {
    return apiClient.put(`/medical-record/${id}/approve`)
  },
  reject(payload: RejectMedicalRecordPayload): Promise<AxiosResponse<JsonResponse<MedicalRecordSummary>>> {
    return apiClient.put('/medical-record/reject', payload)
  },
  delete(id: number): Promise<AxiosResponse<JsonResponse<null>>> {
    return apiClient.delete(`/medical-record/${id}`)
  },
}
