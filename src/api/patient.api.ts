import type { AxiosResponse } from 'axios'
import { apiClient } from './axios'
import type { JsonResponse, PagedResponse } from '../types/common.types'
import type { PrescriptionPrintData } from '../types/prescription.types'
import type {
  Patient,
  PatientListFilters,
  PatientRecordDetail,
  PatientWithRecords,
  UpdatePatientPayload,
  UpsertPatientPayload,
} from '../types/patient.types'

export const patientApi = {
  list(params: PatientListFilters): Promise<AxiosResponse<JsonResponse<PagedResponse<Patient>>>> {
    return apiClient.get('/patient/list', { params })
  },
  searchByIdentifier(identifier: string): Promise<AxiosResponse<JsonResponse<PatientWithRecords>>> {
    return apiClient.get('/patient/search', { params: { identifier } })
  },
  getMe(identifier?: string): Promise<AxiosResponse<JsonResponse<PatientWithRecords>>> {
    const normalizedIdentifier = identifier?.trim()
    return apiClient.get('/patient/me', {
      params: normalizedIdentifier ? { identifier: normalizedIdentifier } : undefined,
    })
  },
  getMyRecordDetail(id: number | string): Promise<AxiosResponse<JsonResponse<PatientRecordDetail>>> {
    return apiClient.get(`/patient/me/records/${id}`)
  },
  getMyRecordPrescription(id: number | string): Promise<AxiosResponse<JsonResponse<PrescriptionPrintData>>> {
    return apiClient.get(`/patient/me/records/${id}/prescription`)
  },
  create(payload: UpsertPatientPayload): Promise<AxiosResponse<JsonResponse<Patient>>> {
    return apiClient.post('/patient/create', payload)
  },
  update(id: number, payload: UpdatePatientPayload): Promise<AxiosResponse<JsonResponse<Patient>>> {
    return apiClient.put(`/patient/update/${id}`, payload)
  },
}
