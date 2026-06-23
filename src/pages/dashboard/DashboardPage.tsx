import { useMemo, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { Button, DatePicker, Select, Skeleton, Table, Tag } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  ClipboardList,
  FileCheck2,
  FileClock,
  FileX2,
  HeartPulse,
  History,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import { dashboardApi } from '../../api/dashboard.api'
import type {
  DashboardCountItem,
  DashboardMetric,
  DashboardOverview,
  DashboardOverviewCard,
  DashboardPeriod,
  DashboardTimeParams,
  DashboardTimelineItem,
  UserPerformance,
} from '../../types/dashboard.types'

const emptyOverview: DashboardOverview = {
  totalRecords: 0,
  totalPatients: 0,
  totalAccounts: 0,
  processingRecords: 0,
  extractedRecords: 0,
  pendingReviewRecords: 0,
  approvedRecords: 0,
  rejectedRecords: 0,
  todayUploads: 0,
  todayApprovals: 0,
}

const { RangePicker } = DatePicker
const API_DATE_FORMAT = 'YYYY-MM-DD'

type TimeFilterMode = 'today' | DashboardPeriod | 'range'

const timeFilterOptions: { value: TimeFilterMode; label: string }[] = [
  { value: 'today', label: 'Hôm nay' },
  { value: 'day', label: 'Theo ngày' },
  { value: 'week', label: 'Theo tuần' },
  { value: 'month', label: 'Theo tháng' },
  { value: 'year', label: 'Theo năm' },
  { value: 'range', label: 'Khoảng ngày' },
]

const metricOptions: { value: DashboardMetric; label: string }[] = [
  { value: 'uploads', label: 'Bệnh án mới' },
  { value: 'approvals', label: 'Đã duyệt' },
  { value: 'rejections', label: 'Từ chối' },
]

function buildDashboardTimeParams(
  mode: TimeFilterMode,
  anchorDate: Dayjs,
  range: [Dayjs | null, Dayjs | null] | null,
): DashboardTimeParams {
  if (mode === 'today') return { period: 'day', date: dayjs().format(API_DATE_FORMAT) }
  if (mode === 'range') {
    return {
      fromDate: range?.[0]?.format(API_DATE_FORMAT),
      toDate: range?.[1]?.format(API_DATE_FORMAT),
    }
  }

  return { period: mode, date: anchorDate.format(API_DATE_FORMAT) }
}

function fallbackOverviewCards(overview: DashboardOverview): DashboardOverviewCard[] {
  return [
    { key: 'totalRecords', label: 'Tổng bệnh án', value: overview.totalRecords, previousValue: 0, change: 0, changePercent: 0, trend: 'flat' },
    { key: 'totalPatients', label: 'Bệnh nhân', value: overview.totalPatients, previousValue: 0, change: 0, changePercent: 0, trend: 'flat' },
    { key: 'todayUploads', label: 'Upload trong kỳ', value: overview.todayUploads, previousValue: 0, change: 0, changePercent: 0, trend: 'flat' },
    { key: 'todayApprovals', label: 'Duyệt trong kỳ', value: overview.todayApprovals, previousValue: 0, change: 0, changePercent: 0, trend: 'flat' },
  ]
}

function TrendText({ card }: { card: DashboardOverviewCard }) {
  const Icon = card.trend === 'up' ? ArrowUpRight : card.trend === 'down' ? ArrowDownRight : ArrowRight
  const color = card.trend === 'up' ? 'text-emerald-600' : card.trend === 'down' ? 'text-rose-600' : 'text-slate-500'

  return (
    <span className={`mt-3 inline-flex items-center gap-1 text-xs font-semibold ${color}`}>
      <Icon size={14} />
      {card.change >= 0 ? '+' : ''}{card.change.toLocaleString('vi-VN')} ({card.changePercent >= 0 ? '+' : ''}{card.changePercent.toLocaleString('vi-VN')}%)
    </span>
  )
}

const overviewCardIcons: Record<string, typeof ClipboardList> = {
  newRecords: ClipboardList,
  totalRecords: ClipboardList,
  totalPatients: HeartPulse,
  totalAccounts: Users,
  processingRecords: Activity,
  extractedRecords: BarChart3,
  pendingReviewRecords: FileClock,
  approvedRecords: FileCheck2,
  rejectedRecords: FileX2,
  todayUploads: ClipboardList,
  todayApprovals: FileCheck2,
}

const overviewCardTones: Record<string, string> = {
  newRecords: 'bg-[#2563EB]',
  totalRecords: 'bg-[#2563EB]',
  totalPatients: 'bg-emerald-500',
  totalAccounts: 'bg-[#2563EB]',
  processingRecords: 'bg-sky-500',
  extractedRecords: 'bg-blue-500',
  pendingReviewRecords: 'bg-amber-500',
  approvedRecords: 'bg-teal-500',
  rejectedRecords: 'bg-rose-500',
  todayUploads: 'bg-[#2563EB]',
  todayApprovals: 'bg-teal-500',
}

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
  card,
}: {
  label: string
  value: number
  icon: typeof ClipboardList
  tone: string
  card?: DashboardOverviewCard
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white p-5 shadow-[0_14px_32px_-28px_rgba(15,23,42,0.36)]">
      <div className={`absolute inset-x-0 top-0 h-1 ${tone}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value.toLocaleString('vi-VN')}</p>
          {card ? <TrendText card={card} /> : null}
        </div>
        <div className="grid size-11 place-items-center rounded-xl bg-[#EFF6FF] text-[#2563EB] ring-1 ring-[#C9D6F0] transition-transform group-hover:-translate-y-0.5">
          <Icon size={20} />
        </div>
      </div>
    </article>
  )
}

function MiniBars({ items, accent }: { items: DashboardCountItem[]; accent: string }) {
  const max = Math.max(...items.map((item) => item.count), 1)

  if (!items.length) {
    return <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">Chưa có dữ liệu</div>
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-medium text-slate-700">{item.label}</span>
            <span className="font-semibold text-slate-950">{item.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${accent}`} style={{ width: `${Math.max((item.count / max) * 100, 8)}%` }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function TimelineChart({ items }: { items: DashboardTimelineItem[] }) {
  const max = Math.max(...items.map((item) => item.count), 1)

  if (!items.length) {
    return <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-400">Chưa có dữ liệu</div>
  }

  return (
    <div className="flex h-64 items-end gap-2 overflow-x-auto rounded-2xl border border-slate-100 bg-slate-50 p-4">
      {items.map((item) => (
        <div key={item.key} className="flex h-full min-w-14 flex-1 flex-col items-center justify-end gap-2">
          <div className="text-xs font-semibold text-slate-700">{item.count}</div>
          <div
            className="w-full max-w-10 rounded-t-xl bg-[#2563EB]"
            style={{ height: `${Math.max((item.count / max) * 100, 6)}%` }}
            title={`${item.label}: ${item.count}`}
          />
          <div className="w-full truncate text-center text-[11px] text-slate-500">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [timeMode, setTimeMode] = useState<TimeFilterMode>('today')
  const [anchorDate, setAnchorDate] = useState<Dayjs>(dayjs())
  const [rangeDates, setRangeDates] = useState<[Dayjs | null, Dayjs | null] | null>(null)
  const [metric, setMetric] = useState<DashboardMetric>('uploads')

  const timeParams = useMemo(
    () => buildDashboardTimeParams(timeMode, anchorDate, rangeDates),
    [anchorDate, rangeDates, timeMode],
  )

  const [overviewQuery, timelineQuery, statusQuery, departmentQuery, performanceQuery] = useQueries({
    queries: [
      { queryKey: ['dashboard', 'overview', timeParams], queryFn: () => dashboardApi.overview(timeParams).then((r) => r.data.data) },
      { queryKey: ['dashboard', 'timeline', metric, timeParams], queryFn: () => dashboardApi.timeline({ ...timeParams, metric }).then((r) => r.data.data) },
      { queryKey: ['dashboard', 'records-by-status', timeParams], queryFn: () => dashboardApi.recordsByStatus({ ...timeParams, scope: 'created' }).then((r) => r.data.data) },
      { queryKey: ['dashboard', 'records-by-department', timeParams], queryFn: () => dashboardApi.recordsByDepartment(timeParams).then((r) => r.data.data) },
      { queryKey: ['dashboard', 'user-performance', timeParams], queryFn: () => dashboardApi.userPerformance(timeParams).then((r) => r.data.data) },
    ],
  })

  const overview = overviewQuery.data ?? emptyOverview
  const timelineItems = timelineQuery.data?.items ?? []
  const statusItems = statusQuery.data ?? []
  const departmentItems = departmentQuery.data ?? []
  const performanceItems = performanceQuery.data ?? []
  const loading = overviewQuery.isLoading || timelineQuery.isLoading || statusQuery.isLoading || departmentQuery.isLoading || performanceQuery.isLoading
  const overviewCards = overview.cards?.length ? overview.cards : fallbackOverviewCards(overview)

  const reviewRate = useMemo(() => {
    if (!overview.totalRecords) return 0
    return Math.round((overview.approvedRecords / overview.totalRecords) * 100)
  }, [overview.approvedRecords, overview.totalRecords])

  return (
    <PageShell
      title="Trung tâm điều hành"
      description="Dashboard dùng các API mới: tổng quan, trạng thái, khoa phòng và hiệu suất người dùng."
      actions={
        <div className="flex flex-wrap items-center justify-end gap-3">
          <Select<TimeFilterMode>
            className="min-w-36"
            options={timeFilterOptions}
            value={timeMode}
            onChange={(mode) => setTimeMode(mode)}
          />
          {timeMode !== 'today' && timeMode !== 'range' ? (
            <DatePicker
              className="w-40"
              picker={timeMode === 'month' || timeMode === 'year' ? timeMode : 'date'}
              value={anchorDate}
              format={timeMode === 'year' ? 'YYYY' : timeMode === 'month' ? 'MM/YYYY' : 'DD/MM/YYYY'}
              onChange={(value) => setAnchorDate(value ?? dayjs())}
            />
          ) : null}
          {timeMode === 'range' ? (
            <RangePicker
              className="w-72"
              value={rangeDates}
              format="DD/MM/YYYY"
              onChange={(values) => setRangeDates(values ? [values[0], values[1]] as [Dayjs | null, Dayjs | null] : null)}
            />
          ) : null}
          <Button icon={<History size={17} />} onClick={() => navigate('/audit-logs')}>
          Nhật ký thao tác
          </Button>
        </div>
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <>
          <section className="relative overflow-hidden rounded-3xl border border-[#D7E2F3] bg-white p-6 text-[#0F172A] shadow-[0_18px_42px_-34px_rgba(15,23,42,0.42)]">
            <div className="absolute inset-y-0 left-0 w-1 bg-[#2563EB]" />
            <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="inline-flex rounded-full border border-[#E5EAF1] bg-[#EFF6FF] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#2563EB]">
                  Tổng quan trực tiếp
                </p>
                <h2 className="mt-5 text-4xl font-bold tracking-tight">Hệ thống đang có {overview.totalRecords} hồ sơ</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-[#64748B]">
                  Hôm nay có {overview.todayUploads} hồ sơ được upload và {overview.todayApprovals} hồ sơ được duyệt. Tỉ lệ hoàn tất hiện tại {reviewRate}%.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[#F3D99B] bg-[#FCF1D9] p-4">
                  <p className="text-sm text-[#9A6B0E]">Chờ duyệt</p>
                  <p className="mt-2 text-3xl font-bold text-[#9A6B0E]">{overview.pendingReviewRecords}</p>
                </div>
                <div className="rounded-2xl border border-[#F3C2BD] bg-[#FCE8E6] p-4">
                  <p className="text-sm text-[#B23A30]">Bị từ chối</p>
                  <p className="mt-2 text-3xl font-bold text-[#B23A30]">{overview.rejectedRecords}</p>
                </div>
              </div>
            </div>
          </section>

          {overview.cards?.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {overviewCards.map((card) => (
                <MetricCard
                  key={card.key}
                  label={card.label}
                  value={card.value}
                  icon={overviewCardIcons[card.key] ?? ClipboardList}
                  tone={overviewCardTones[card.key] ?? 'bg-[#2563EB]'}
                  card={card}
                />
              ))}
            </div>
          ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Tổng bệnh án" value={overview.totalRecords} icon={ClipboardList} tone="bg-[#2563EB]" />
            <MetricCard label="Bệnh nhân" value={overview.totalPatients} icon={HeartPulse} tone="bg-emerald-500" />
            <MetricCard label="Tài khoản" value={overview.totalAccounts} icon={Users} tone="bg-[#2563EB]" />
            <MetricCard label="Đang OCR" value={overview.processingRecords} icon={Activity} tone="bg-sky-500" />
            <MetricCard label="OCR xong" value={overview.extractedRecords} icon={BarChart3} tone="bg-blue-500" />
            <MetricCard label="Chờ duyệt" value={overview.pendingReviewRecords} icon={FileClock} tone="bg-amber-500" />
            <MetricCard label="Đã duyệt" value={overview.approvedRecords} icon={FileCheck2} tone="bg-teal-500" />
            <MetricCard label="Từ chối" value={overview.rejectedRecords} icon={FileX2} tone="bg-rose-500" />
          </div>

          )}

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Timeline</h2>
                <p className="text-sm text-slate-500">Dữ liệu theo kỳ từ endpoint dashboard/timeline.</p>
              </div>
              <Select<DashboardMetric>
                className="min-w-40"
                options={metricOptions}
                value={metric}
                onChange={(value) => setMetric(value)}
              />
            </div>
            <TimelineChart items={timelineItems} />
          </section>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Trạng thái hồ sơ</h2>
                  <p className="text-sm text-slate-500">Đếm theo trạng thái backend trả về</p>
                </div>
                <Tag color="blue">records-by-status</Tag>
              </div>
              <MiniBars items={statusItems} accent="bg-[#2563EB]" />
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Khoa phòng nổi bật</h2>
                  <p className="text-sm text-slate-500">Sắp xếp theo số lượng hồ sơ</p>
                </div>
                <Tag color="green">records-by-department</Tag>
              </div>
              <MiniBars items={departmentItems.slice(0, 8)} accent="bg-emerald-500" />
            </section>
          </div>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-950">Hiệu suất người dùng</h2>
              <p className="text-sm text-slate-500">Upload, duyệt và từ chối theo từng tài khoản.</p>
            </div>
            <Table<UserPerformance>
              rowKey="accountId"
              dataSource={performanceItems}
              pagination={false}
              columns={[
                { title: 'Người dùng', dataIndex: 'accountName' },
                { title: 'Uploaded', dataIndex: 'uploaded' },
                { title: 'Approved', dataIndex: 'approved' },
                {
                  title: 'Rejected',
                  dataIndex: 'rejected',
                  render: (value: number) => <span className={value ? 'font-semibold text-rose-600' : ''}>{value}</span>,
                },
                {
                  title: 'Total',
                  dataIndex: 'totalActions',
                  render: (_value: number | undefined, record) =>
                    (record.totalActions ?? record.uploaded + record.approved + record.rejected).toLocaleString('vi-VN'),
                },
              ]}
            />
          </section>
        </>
      )}
    </PageShell>
  )
}
