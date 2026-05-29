import type { RecordStatus } from '../types/medicalRecord.types'
import { cn } from '../lib/cn'

const statusConfig: Record<RecordStatus, { label: string; dot: string; bg: string; text: string }> = {
  Processing: {
    label: 'Đang xử lý',
    dot: 'bg-slate-400',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
  },
  Extracted: {
    label: 'OCR xong',
    dot: 'bg-blue-500',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  'Pending Doctor Review': {
    label: 'Chờ duyệt',
    dot: 'bg-amber-400 animate-pulse',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
  },
  Approved: {
    label: 'Đã duyệt',
    dot: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
  Rejected: {
    label: 'Từ chối',
    dot: 'bg-red-500',
    bg: 'bg-red-50',
    text: 'text-red-700',
  },
}

export default function StatusBadge({ status }: { status: RecordStatus }) {
  const config = statusConfig[status]

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
