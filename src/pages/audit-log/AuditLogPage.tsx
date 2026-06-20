import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Descriptions, Input, Select, Skeleton, Spin, Table, Tooltip } from 'antd'
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
  Shield,
  Trash2,
  UserRound,
  XCircle,
} from 'lucide-react'
import PageShell from '../../components/PageShell'
import { auditLogApi } from '../../api/auditLog.api'
import type { AuditLog, AuditLogFilters } from '../../types/auditLog.types'
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

function JsonPanel({ label, value }: { label: string; value: string | null }) {
  const text = (() => {
    if (!value) return null
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value
    }
  })()

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{label}</p>
      {text ? (
        <pre className="max-h-72 min-h-[60px] overflow-auto rounded-2xl bg-slate-950 p-4 text-xs leading-5 text-slate-100">
          {text}
        </pre>
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
      <div className="absolute inset-0 bg-slate-950/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="relative overflow-hidden bg-slate-950 px-7 py-6">
          <div className="relative flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="grid size-11 place-items-center rounded-2xl bg-white/10">
                <Icon size={20} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Chi tiết nhật ký</p>
                {data ? (
                  <h2 className="mt-0.5 text-lg font-bold text-white">
                    {data.actionLabel ?? data.action}{' '}
                    <span className="font-normal text-slate-400">#{data.id}</span>
                  </h2>
                ) : (
                  <div className="mt-1 h-5 w-40 animate-pulse rounded-lg bg-white/10" />
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="grid size-9 place-items-center rounded-2xl text-slate-400 transition hover:bg-white/10 hover:text-white"
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
              <JsonPanel label="Old Value" value={data.oldValue} />
              <div className="flex h-full items-center justify-center pt-7">
                <ArrowRight size={18} className="text-slate-300" />
              </div>
              <JsonPanel label="New Value" value={data.newValue} />
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

function TimelineBar() {
  const entries = Object.values(ACTION_META)

  return (
    <div className="flex items-center gap-4 overflow-x-auto py-1">
      {entries.map((m) => (
        <div key={m.label} className="flex shrink-0 items-center gap-1.5">
          <span className={cn('size-2 rounded-full', m.dot)} />
          <span className="text-xs text-slate-400">{m.label}</span>
        </div>
      ))}
    </div>
  )
}

export default function AuditLogPage() {
  const [filters, setFilters] = useState<AuditLogFilters>({ page: 1, limit: 10 })
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [actorIdDraft, setActorIdDraft] = useState('')
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () => auditLogApi.list(filters).then((r) => r.data.data),
  })

  const resetMutation = useMutation({
    mutationFn: async () => {
      setActorIdDraft('')
      setFilters({ page: 1, limit: 10 })
      await queryClient.invalidateQueries({ queryKey: ['audit-logs'] })
    },
  })

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
        <div className="relative overflow-hidden bg-slate-950 px-7 py-6">

          <div className="relative grid gap-6 lg:grid-cols-[auto_1fr]">
            {/* stat block */}
            <div className="flex items-center gap-5">
              <div className="grid size-14 place-items-center rounded-2xl bg-white/10">
                <History size={24} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">Tổng log</p>
                {isLoading ? (
                  <div className="mt-1 h-8 w-20 animate-pulse rounded-lg bg-white/10" />
                ) : (
                  <p className="mt-1 text-4xl font-bold text-white">{(data?.totalItems ?? 0).toLocaleString('vi-VN')}</p>
                )}
                <TimelineBar />
              </div>
            </div>

            {/* filter controls */}
            <div className="flex flex-wrap items-center gap-3 lg:justify-end">
              <Select
                className="min-w-44"
                options={actionOptions}
                value={filters.action ?? ''}
                onChange={(action) =>
                  setFilters((prev) => ({ ...prev, action: action || undefined, page: 1 }))
                }
              />
              <Input
                className="w-52"
                placeholder="Loại tài nguyên"
                prefix={<Shield size={13} className="text-slate-400" />}
                value={filters.resourceType ?? ''}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, resourceType: e.target.value || undefined, page: 1 }))
                }
              />
              <Input
                className="w-40"
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
