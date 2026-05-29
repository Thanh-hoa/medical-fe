import type { Patient } from './patient.types'

export type RecordStatus =
  | 'Processing'
  | 'Extracted'
  | 'Pending Doctor Review'
  | 'Approved'
  | 'Rejected'

export interface LabResult {
  testName: string
  testValue: string
  unit: string
  referenceRange: string
  isAbnormal: boolean
}

export interface MedicalRecordSummary {
  id: number
  recordNumber: string
  status: RecordStatus
  department: string | null
  recordType: string | null
  fileName: string
  fileType: string
  uploadedBy: number
  patient: Patient | null
  createdAt: string
  updatedAt: string | null
}

export interface MedicalRecordDetail extends MedicalRecordSummary {
  originalImagePath: string | null
  notes: string | null
  rejectionReason: string | null
  verifiedBy: number | null
  verifiedAt: string | null
  approvedBy: number | null
  approvedAt: string | null
  extractedData: Record<string, string>
  labData: LabResult[]
}

export interface MedicalRecordListFilters {
  q?: string
  status?: string
  patientId?: number
  page?: number
  limit?: number
}

export interface UpdateMedicalRecordFieldPayload {
  recordId: number
  fieldName: string
  fieldValue: string
}

export interface RejectMedicalRecordPayload {
  id: number
  rejectionReason: string
}
