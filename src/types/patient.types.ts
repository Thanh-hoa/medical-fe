import type { MedicalRecordSummary } from './medicalRecord.types'

export interface Patient {
  id: number
  bhyt: string
  name: string
  dob: string | null
  gender: string | null
  address: string | null
  phone: string | null
  createdAt: string
  updatedAt: string | null
}

export interface PatientWithRecords {
  patient: Patient
  records: MedicalRecordSummary[]
  totalRecords: number
}

export interface PatientListFilters {
  q?: string
  page?: number
  limit?: number
}

export interface UpsertPatientPayload {
  bhyt: string
  name: string
  dob?: string
  gender?: string
  address?: string
  phone?: string
}
