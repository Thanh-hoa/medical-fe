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

export interface PatientRecordSummary {
  id: number
  recordNumber: string
  status: string
  department: string | null
  signerName: string | null
  diagnosis: string | null
}

export interface PatientWithRecords {
  patient: Patient
  records: PatientRecordSummary[]
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
  dob?: string | null
  gender?: string | null
  address?: string | null
  phone?: string | null
}

export interface UpdatePatientPayload extends UpsertPatientPayload {
  id: number
}
