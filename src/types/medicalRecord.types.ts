import type { Patient } from './patient.types'

export type CanonicalRecordStatus =
  | 'PROCESSING'
  | 'EXTRACTED'
  | 'PENDING_DOCTOR_REVIEW'
  | 'APPROVED'
  | 'REJECTED'

export type RecordStatus =
  | CanonicalRecordStatus
  | 'Processing'
  | 'Extracted'
  | 'Pending Doctor Review'
  | 'Approved'
  | 'Rejected'

export function normalizeRecordStatus(status?: string | null): CanonicalRecordStatus {
  const normalized = status?.trim().replaceAll(' ', '_').toUpperCase()

  if (
    normalized === 'EXTRACTED' ||
    normalized === 'PENDING_DOCTOR_REVIEW' ||
    normalized === 'APPROVED' ||
    normalized === 'REJECTED'
  ) {
    return normalized
  }

  return 'PROCESSING'
}

export interface ExtractedData {
  facility?: string | null
  department?: string | null
  signerName?: string | null
  diagnosis?: string | null
  extra?: Record<string, string> | null
  [key: string]: string | Record<string, string> | null | undefined
}

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
  verifiedBy: number | null
  verifiedAt: string | null
  approvedBy: number | null
  approvedAt: string | null
  rejectedBy: number | null
  rejectedAt: string | null
  rejectionReason: string | null
  extractedData: ExtractedData | null
  labData: LabResult[]
}

export interface MedicalRecordListFilters {
  q?: string
  status?: string
  patientId?: number
  page?: number
  limit?: number
  sort_by?: 'created_at' | 'status' | 'record_number'
  order_by?: 'asc' | 'desc'
}

export interface UpdateMedicalRecordFieldPayload {
  recordId: number
  fieldName: string
  fieldValue: string
}

export interface UpdateMedicalRecordDetailPayload {
  id: number
  department?: string | null
  recordType?: string | null
  notes?: string | null
  patient?: {
    bhyt: string
    name: string
    dob?: string | null
    gender?: string | null
    address?: string | null
    phone?: string | null
  }
  extractedData?: ExtractedData | null
  labData?: LabResult[]
}
