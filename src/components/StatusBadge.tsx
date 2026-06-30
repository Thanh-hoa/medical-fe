import { normalizeRecordStatus, type CanonicalRecordStatus, type RecordStatus } from '../types/medicalRecord.types'
import { cn } from '../lib/cn'

const statusConfig: Record<CanonicalRecordStatus, { label: string; dot: string; bg: string; text: string }> = {
  PROCESSING: {
    label: 'Đang xử lý',
    dot: 'bg-[#64748B]',
    bg: 'bg-[#F7F9FC] ring-1 ring-[#E5EAF1]',
    text: 'text-[#64748B]',
  },
  EXTRACTED: {
    label: 'OCR xong',
    dot: 'bg-[#2563EB]',
    bg: 'bg-[#EFF6FF] ring-1 ring-[#C9D6F0]',
    text: 'text-[#2563EB]',
  },
  PENDING_DOCTOR_REVIEW: {
    label: 'Chờ bác sĩ duyệt',
    dot: 'bg-[#9A6B0E] animate-pulse',
    bg: 'bg-[#FCF1D9] ring-1 ring-[#F3D99B]',
    text: 'text-[#9A6B0E]',
  },
  APPROVED: {
    label: 'Đã duyệt',
    dot: 'bg-[#1B8050]',
    bg: 'bg-[#E3F6EB] ring-1 ring-[#BFE8D0]',
    text: 'text-[#1B8050]',
  },
  REJECTED: {
    label: 'Bị từ chối',
    dot: 'bg-[#B23A30]',
    bg: 'bg-[#FCE8E6] ring-1 ring-[#F3C2BD]',
    text: 'text-[#B23A30]',
  },
}

export default function StatusBadge({ status }: { status: RecordStatus }) {
  const config = statusConfig[normalizeRecordStatus(status)]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
        config.bg,
        config.text,
      )}
    >
      <span className={cn('size-2 rounded-full', config.dot)} />
      {config.label}
    </span>
  )
}
