export interface Medicine {
  id: number
  code: string
  name: string
  strength: string | null
  unit: string | null
  dosageForm: string | null
  description: string | null
}

export interface MedicineListFilters {
  q?: string
  page?: number
  limit?: number
}

export type PrescriptionStatus = 'DRAFT' | 'ISSUED'
export type PrescriptionDurationOption = 'ONE_WEEK' | 'TWO_WEEKS' | 'THREE_WEEKS' | 'ONE_MONTH' | 'CUSTOM'

export interface PrescriptionItem {
  id?: number
  medicineId: number | null
  medicineName: string
  strength: string | null
  unit: string | null
  quantity: number
  morningDose: string | null
  noonDose: string | null
  afternoonDose: string | null
  eveningDose: string | null
  instruction: string | null
  sortOrder: number
}

export interface Prescription {
  id: number
  prescriptionNumber: string
  medicalRecordId: number
  patientId: number
  doctorId: number
  doctorName: string
  status: PrescriptionStatus
  hospitalName: string | null
  receiverName: string | null
  insuranceCode: string | null
  receiverAddress: string | null
  diagnosis: string | null
  durationOption: PrescriptionDurationOption | null
  durationDays: number | null
  advice: string | null
  issuedAt: string | null
  createdAt: string
  items: PrescriptionItem[]
}

export interface UpdatePrescriptionItemPayload {
  medicine_id: number | null
  medicine_name: string
  strength: string | null
  unit: string | null
  quantity: number
  morning_dose: string | null
  noon_dose: string | null
  afternoon_dose: string | null
  evening_dose: string | null
  instruction: string | null
  sort_order: number
}

export interface UpdatePrescriptionPayload {
  hospital_name: string | null
  receiver_name: string | null
  insurance_code: string | null
  receiver_address: string | null
  diagnosis: string | null
  duration_option: PrescriptionDurationOption | null
  duration_days: number | null
  advice: string | null
  items: UpdatePrescriptionItemPayload[]
}

export interface PrescriptionPrintData {
  prescriptionNumber: string
  hospitalName: string | null
  receiverName: string | null
  insuranceCode: string | null
  receiverAddress: string | null
  diagnosis: string | null
  doctorName: string | null
  durationDays: number | null
  advice: string | null
  issuedAt: string
  items: PrescriptionItem[]
}
