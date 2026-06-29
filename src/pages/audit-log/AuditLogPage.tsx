import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, DatePicker, Descriptions, Input, Select, Skeleton, Spin, Table, Tooltip } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  FileUp,
  History,
  Network,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
  UserRound,
  XCircle,
} from 'lucide-react'
import PageShell from '../../components/PageShell'
import { auditLogApi } from '../../api/auditLog.api'
import type { AuditLog, AuditLogFilters, AuditLogPeriod } from '../../types/auditLog.types'
import { cn } from '../../lib/cn'

type ActionKey = 'UPLOAD' | 'SUBMIT' | 'APPROVE' | 'REJECT' | 'RESUBMIT' | 'UPDATE' | 'DELETE'

const ACTION_META: Record<
  ActionKey,
  { icon: typeof History; dot: string; badge: string; label: string }
> = {
  UPLOAD: {
    icon: FileUp,
    dot: 'bg-sky-400',
    badge: 'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
    label: 'Upload',
  },
  SUBMIT: {
    icon: Send,
    dot: 'bg-amber-400',
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
    label: 'Submit',
  },
  APPROVE: {
    icon: CheckCircle2,
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
    label: 'Approve',
  },
  REJECT: {
    icon: XCircle,
    dot: 'bg-rose-400',
    badge: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
    label: 'Reject',
  },
  RESUBMIT: {
    icon: RotateCcw,
    dot: 'bg-[#2563EB]',
    badge: 'bg-[#EFF6FF] text-[#2563EB] ring-1 ring-[#C9D6F0]',
    label: 'Resubmit',
  },
  UPDATE: {
    icon: RefreshCw,
    dot: 'bg-[#2563EB]',
    badge: 'bg-[#EFF6FF] text-[#2563EB] ring-1 ring-[#C9D6F0]',
    label: 'Update',
  },
  DELETE: {
    icon: Trash2,
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200',
    label: 'Delete',
  },
}

function getActionMeta(action: string) {
  return ACTION_META[action as ActionKey] ?? ACTION_META.UPDATE
}

function ActionBadge({ action, label }: { action: string; label?: string | null }) {
  const meta = getActionMeta(action)
  const Icon = meta.icon

  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', meta.badge)}>
      <Icon size={12} strokeWidth={2.5} />
      {label ?? action}
    </span>
  )
}

function humanizeKey(key: string) {
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function stringifyValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'boolean') return value ? 'Có' : 'Không'
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  if (Array.isArray(value)) return value.map(stringifyValue).join(', ')
  if (typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${humanizeKey(key)}: ${stringifyValue(item)}`)
      .join('; ')
  }
  return String(value)
}

function parseAuditValue(value: string | null) {
  if (!value) return []

  try {
    const parsed = JSON.parse(value) as unknown

    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return Object.entries(parsed as Record<string, unknown>).map(([key, item]) => ({
        label: humanizeKey(key),
        value: stringifyValue(item),
      }))
    }

    return [{ label: 'Giá trị', value: stringifyValue(parsed) }]
  } catch {
    return [{ label: 'Giá trị', value }]
  }
}

function ValuePanel({ label, value }: { label: string; value: string | null }) {
  const rows = parseAuditValue(value)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      {rows.length ? (
        <div className="max-h-72 min-h-[60px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-3">
            {rows.map((row) => (
              <div key={`${row.label}-${row.value}`} className="grid gap-1 sm:grid-cols-[140px_1fr]">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{row.label}</p>
                <p className="break-words text-sm font-medium text-slate-800">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[60px] items-center justify-center rounded-2xl border border-dashed border-slate-200 text-sm text-slate-400">
          —
        </div>
      )}
    </div>
  )
}

function ActorCell({ log }: { log: AuditLog }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-500">
        <UserRound size={14} />
      </div>
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-800">
          {log.actorName ?? (log.actorId !== null ? `Actor #${log.actorId}` : 'Chưa có dữ liệu')}
        </p>
        <p className={cn('text-xs', log.actorId !== null ? 'font-mono text-slate-500' : 'text-amber-600')}>
          {log.actorId !== null ? `ID: ${log.actorId}` : 'Backend chưa trả actorId'}
        </p>
      </div>
    </div>
  )
}

function IpCell({ ipAddress }: { ipAddress: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-400">
        <Network size={13} />
      </div>
      {ipAddress ? (
        <Tooltip title={ipAddress}>
          <span className="font-mono text-xs text-slate-600">{ipAddress}</span>
        </Tooltip>
      ) : (
        <span className="text-xs text-amber-600">Chưa có IP</span>
      )}
    </div>
  )
}

function DetailModal({ id, onClose }: { id: number; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-log', id],
    queryFn: () => auditLogApi.detail(id).then((r) => r.data.data),
  })

  const meta = data ? getActionMeta(data.action) : null
  const Icon = meta?.icon ?? History

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/45" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative overflow-hidden border-b border-slate-200 bg-[#F7F9FC] px-7 py-6">
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid size-11 place-items-center rounded-2xl bg-[#EFF6FF] text-[#2563EB] ring-1 ring-[#C9D6F0]">
                <Icon size={20} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#2563EB]">Chi tiết nhật ký</p>
                {data ? (
                  <h2 className="mt-0.5 text-lg font-bold text-slate-950">
                    {data.actionLabel ?? data.action}{' '}
                    <span className="font-normal text-slate-500">#{data.id}</span>
                  </h2>
                ) : (
                  <div className="mt-1 h-5 w-40 animate-pulse rounded-lg bg-slate-200" />
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid size-9 place-items-center rounded-2xl text-slate-400 transition hover:bg-white hover:text-slate-700"
            >
              ✕
            </button>
          </div>
        </div>

        {isLoading || !data ? (
          <div className="flex items-center justify-center p-12">
            <Spin size="large" />
          </div>
        ) : (
          <div className="space-y-5 p-7">
            <Descriptions bordered column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="ID">{data.id}</Descriptions.Item>
              <Descriptions.Item label="Action">
                <ActionBadge action={data.action} label={data.actionLabel} />
              </Descriptions.Item>
              <Descriptions.Item label="Người thao tác">
                <div className="space-y-1">
                  <p className="font-medium text-slate-800">
                    {data.actorName ?? (data.actorId !== null ? `Actor #${data.actorId}` : 'Chưa có dữ liệu')}
                  </p>
                  <p className={cn('text-xs', data.actorId !== null ? 'font-mono text-slate-500' : 'text-amber-600')}>
                    {data.actorId !== null ? `ID: ${data.actorId}` : 'Backend chưa trả actorId'}
                  </p>
                </div>
              </Descriptions.Item>
              <Descriptions.Item label="Tài nguyên">
                <span className="font-mono text-xs">
                  {data.resourceType}:{data.resourceId ?? '—'}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="IP">
                {data.ipAddress ? (
                  <span className="font-mono text-xs text-slate-600">{data.ipAddress}</span>
                ) : (
                  <span className="text-xs text-amber-600">Backend chưa trả IP</span>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Thời điểm">
                {new Date(data.createdAt).toLocaleString('vi-VN')}
              </Descriptions.Item>
              {data.userAgent ? (
                <Descriptions.Item label="User Agent" span={2}>
                  <span className="break-all text-xs text-slate-500">{data.userAgent}</span>
                </Descriptions.Item>
              ) : null}
            </Descriptions>

            <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
              <ValuePanel label="Giá trị cũ" value={data.oldValue} />
              <div className="flex h-full items-center justify-center pt-7">
                <ArrowRight size={18} className="text-slate-300" />
              </div>
              <ValuePanel label="Giá trị mới" value={data.newValue} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const actionOptions = [
  { value: '', label: 'Tất cả thao tác' },
  { value: 'UPLOAD', label: 'UPLOAD' },
  { value: 'SUBMIT', label: 'SUBMIT' },
  { value: 'APPROVE', label: 'APPROVE' },
  { value: 'REJECT', label: 'REJECT' },
  { value: 'RESUBMIT', label: 'RESUBMIT' },
  { value: 'UPDATE', label: 'UPDATE' },
  { value: 'DELETE', label: 'DELETE' },
]

const { RangePicker } = DatePicker
const API_DATE_FORMAT = 'YYYY-MM-DD'

type TimeFilterMode = 'all' | 'today' | AuditLogPeriod | 'range'

const timeFilterOptions: { value: TimeFilterMode; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'day', label: 'Theo ngày' },
  { value: 'week', label: 'Theo tuần' },
  { value: 'month', label: 'Theo tháng' },
  { value: 'year', label: 'Theo năm' },
  { value: 'range', label: 'Khoảng ngày' },
]

function clearTimeFilters(filters: AuditLogFilters): AuditLogFilters {
  const { period: _period, date: _date, fromDate: _fromDate, toDate: _toDate, ...rest } = filters
  return rest
}

function buildTimeFilters(mode: TimeFilterMode, anchorDate: Dayjs, range: [Dayjs | null, Dayjs | null] | null) {
  if (mode === 'all') return {}
  if (mode === 'today') return { period: 'day' as const, date: dayjs().format(API_DATE_FORMAT) }
  if (mode === 'range') {
    return {
      fromDate: range?.[0]?.format(API_DATE_FORMAT),
      toDate: range?.[1]?.format(API_DATE_FORMAT),
    }
  }

  return { period: mode, date: anchorDate.format(API_DATE_FORMAT) }
}

function TimelineBar() {
  const entries = Object.values(ACTION_META)

  return (
    <div className="flex items-center gap-4 overflow-x-auto py-1">
      {entries.map((m) => (
        <div key={m.label} className="flex shrink-0 items-center gap-1.5">
          <span className={cn('size-2 rounded-full', m.dot)} />
          <span className="text-xs text-slate-500">{m.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, limit: 10 })
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [actorIdDraft, setActorIdDraft] = useState('')
  const [timeMode, setTimeMode] = useState<TimeFilterMode>('all')
  const [anchorDate, setAnchorDate] = useState<Dayjs>(dayjs())
  const [rangeDates, setRangeDates] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditLogApi.list(filters).then((r) => r.data.data),
  })

  const resetMutation = useMutation({
    mutationFn: async () => {
      setActorIdDraft('')
      setTimeMode('all')
      setAnchorDate(dayjs())
      setRangeDates(null)
      setFilters({ page: 1, limit: 10 })
      await queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
  })

  const applyTimeFilter = (
    mode: TimeFilterMode,
    nextAnchorDate = anchorDate,
    nextRangeDates = rangeDates,
  ) => {
    setFilters((prev) => ({
      ...clearTimeFilters(prev),
      ...buildTimeFilters(mode, nextAnchorDate, nextRangeDates),
      page: 1,
    }))
  }

  return (
    <PageShell
      title="Nhật ký thao tác"
      description="Truy vết toàn bộ sự kiện: upload, gửi duyệt, phê duyệt, từ chối, nộp lại, cập nhật, xóa."
      actions={
        <Button
          icon={<RotateCcw size={15} />}
          loading={resetMutation.isPending}
          onClick={() => resetMutation.mutate()}
        >
          Đặt lại bộ lọc
        </Button>
      }
    >
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
        {/* ── Header panel ── */}
        <div className="relative overflow-hidden border-b border-[#DDE6F3] bg-[#F7F9FC] px-7 py-6">

          <div className="relative grid gap-6 lg:grid-cols-[auto_1fr]">
            {/* stat block */}
            <div className="flex items-center gap-5">
              <div className="grid size-14 place-items-center rounded-2xl bg-[#EFF6FF] text-[#2563EB] ring-1 ring-[#C9D6F0]">
                <History size={24} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#64748B]">Tổng log</p>
                {isLoading ? (
                  <div className="mt-1 h-8 w-20 animate-pulse rounded-lg bg-slate-200" />
                ) : (
                  <p className="mt-1 text-4xl font-bold text-slate-950">{(data?.totalItems ?? 0).toLocaleString('vi-VN')}</p>
                )}
                <TimelineBar />
              </div>
            </div>

            {/* filter controls */}
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:ml-auto lg:max-w-[620px]">
              <Select<TimeFilterMode>
                className="w-full"
                options={timeFilterOptions}
                value={timeMode}
                onChange={(mode) => {
                  setTimeMode(mode)
                  applyTimeFilter(mode)
                }}
              />
              {timeMode !== 'all' && timeMode !== 'today' && timeMode !== 'range' ? (
                <DatePicker
                  className="w-full"
                  picker={timeMode === 'month' || timeMode === 'year' ? timeMode : 'date'}
                  value={anchorDate}
                  format={timeMode === 'year' ? 'YYYY' : timeMode === 'month' ? 'MM/YYYY' : 'DD/MM/YYYY'}
                  onChange={(value) => {
                    const nextDate = value ?? dayjs()
                    setAnchorDate(nextDate)
                    applyTimeFilter(timeMode, nextDate)
                  }}
                />
              ) : null}
              {timeMode === 'range' ? (
                <RangePicker
                  className="w-full sm:col-span-2"
                  value={rangeDates}
                  format="DD/MM/YYYY"
                  onChange={(values) => {
                    const nextRange = values ? [values[0], values[1]] as [Dayjs | null, Dayjs | null] : null
                    setRangeDates(nextRange)
                    applyTimeFilter('range', anchorDate, nextRange)
                  }}
                />
              ) : null}
              <Select
                className="w-full"
                options={actionOptions}
                value={filters.action ?? ''}
                onChange={(action) =>
                  setFilters((prev) => ({ ...prev, action: action || undefined, page: 1 }))
                }
              />
              <Input
                className="w-full"
                placeholder="ID người thao tác"
                prefix={<UserRound size={13} className="text-slate-400" />}
                value={actorIdDraft}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '')
                  setActorIdDraft(value)
                  setFilters((prev) => ({
                    ...prev,
                    actorId: value ? Number(value) : undefined,
                    page: 1,
                  }))
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Table ── */}
        <div className="p-5">
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : (
            <Table<AuditLog>
              rowKey="id"
              dataSource={data?.items ?? []}
              scroll={{ x: 760 }}
              pagination={{
                current: filters.page,
                pageSize: filters.limit,
                total: data?.totalItems ?? 0,
                showSizeChanger: true,
                showTotal: (total) => `${total} bản ghi`,
                onChange: (page, pageSize) =>
                  setFilters((prev) => ({ ...prev, page, limit: pageSize })),
              }}
              rowClassName={(record) =>
                cn(
                  'transition-colors',
                  record.action === 'REJECT' && '[&>td]:!bg-rose-50/40',
                  record.action === 'APPROVE' && '[&>td]:!bg-emerald-50/40',
                )
              }
              columns={[
                {
                  title: '',
                  width: 6,
                  render: (_, record) => {
                    const meta = getActionMeta(record.action)
                    return (
                      <div className="flex justify-center">
                        <span className={cn('block size-2 rounded-full', meta.dot)} />
                      </div>
                    )
                  },
                },
                {
                  title: 'Thao tác',
                  width: 160,
                  render: (_, record) => (
                    <div className="space-y-1.5">
                      <ActionBadge action={record.action} label={record.actionLabel} />
                      <p className="text-xs text-slate-400">{record.resourceType}</p>
                    </div>
                  ),
                },
                {
                  title: 'Người thực hiện',
                  width: 220,
                  render: (_, record) => <ActorCell log={record} />,
                },
                {
                  title: 'Tài nguyên',
                  render: (_, record) => (
                    <span className="rounded-lg bg-slate-100 px-2 py-1 font-mono text-xs text-slate-600">
                      {record.resourceType}:{record.resourceId ?? '—'}
                    </span>
                  ),
                },
                {
                  title: 'IP',
                  dataIndex: 'ipAddress',
                  width: 160,
                  render: (v: string | null) => <IpCell ipAddress={v} />,
                },
                {
                  title: 'Thời điểm',
                  dataIndex: 'createdAt',
                  render: (v: string) => (
                    <div>
                      <p className="text-sm text-slate-700">
                        {new Date(v).toLocaleDateString('vi-VN')}
                      </p>
                      <p className="text-xs text-slate-400">
                        {new Date(v).toLocaleTimeString('vi-VN')}
                      </p>
                    </div>
                  ),
                },
                {
                  title: '',
                  width: 80,
                  render: (_, record) => (
                    <Button
                      size="small"
                      icon={<Eye size={14} />}
                      onClick={() => setSelectedId(record.id)}
                    >
                      Xem
                    </Button>
                  ),
                },
              ]}
            />
          )}
        </div>
      </div>

      {selectedId !== null && (
        <DetailModal id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </PageShell>
  )
}
