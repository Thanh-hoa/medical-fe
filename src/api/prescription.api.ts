import type { AxiosResponse } from 'axios'
import { apiClient } from './axios'
import type { JsonResponse, PagedResponse } from '../types/common.types'
import type {
  Medicine,
  MedicineListFilters,
  Prescription,
  PrescriptionPrintData,
  UpdatePrescriptionPayload,
} from '../types/prescription.types'

export const medicineApi = {
  list(params: MedicineListFilters): Promise<AxiosResponse<JsonResponse<PagedResponse<Medicine>>>> {
    return apiClient.get('/medicine/list', { params })
  },
}

export const prescriptionApi = {
  createForMedicalRecord(recordId: number | string): Promise<AxiosResponse<JsonResponse<Prescription>>> {
    return apiClient.post(`/prescription/medical-record/${recordId}`)
  },

  getByMedicalRecord(recordId: number | string): Promise<AxiosResponse<JsonResponse<Prescription | null>>> {
    return apiClient.get(`/prescription/medical-record/${recordId}`)
  },

  update(
    id: number | string,
    payload: UpdatePrescriptionPayload,
  ): Promise<AxiosResponse<JsonResponse<Prescription>>> {
    return apiClient.put(`/prescription/${id}`, payload)
  },

  issue(id: number | string): Promise<AxiosResponse<JsonResponse<Prescription>>> {
    return apiClient.put(`/prescription/${id}/issue`)
  },

  print(id: number | string): Promise<AxiosResponse<JsonResponse<PrescriptionPrintData>>> {
    return apiClient.get(`/prescription/${id}/print`)
  },
}
