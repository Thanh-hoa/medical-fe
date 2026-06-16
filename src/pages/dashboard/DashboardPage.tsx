import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { Button, Skeleton, Table, Tag } from 'antd'
import {
  Activity,
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
import type { DashboardCountItem, DashboardOverview, UserPerformance } from '../../types/dashboard.types'

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

function MetricCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: typeof ClipboardList
  tone: string
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-white/70 bg-white p-5 shadow-[0_18px_50px_-32px_rgba(15,23,42,0.55)]">
      <div className={`absolute inset-x-0 top-0 h-1 ${tone}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{value.toLocaleString('vi-VN')}</p>
        </div>
        <div className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-white transition-transform group-hover:-translate-y-0.5">
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

export default function DashboardPage() {
  const navigate = useNavigate()
  const [overviewQuery, statusQuery, departmentQuery, performanceQuery] = useQueries({
    queries: [
      { queryKey: ['dashboard', 'overview'], queryFn: () => dashboardApi.overview().then((r) => r.data.data) },
      { queryKey: ['dashboard', 'records-by-status'], queryFn: () => dashboardApi.recordsByStatus().then((r) => r.data.data) },
      { queryKey: ['dashboard', 'records-by-department'], queryFn: () => dashboardApi.recordsByDepartment().then((r) => r.data.data) },
      { queryKey: ['dashboard', 'user-performance'], queryFn: () => dashboardApi.userPerformance().then((r) => r.data.data) },
    ],
  })

  const overview = overviewQuery.data ?? emptyOverview
  const statusItems = statusQuery.data ?? []
  const departmentItems = departmentQuery.data ?? []
  const performanceItems = performanceQuery.data ?? []
  const loading = overviewQuery.isLoading || statusQuery.isLoading || departmentQuery.isLoading || performanceQuery.isLoading

  const reviewRate = useMemo(() => {
    if (!overview.totalRecords) return 0
    return Math.round((overview.approvedRecords / overview.totalRecords) * 100)
  }, [overview.approvedRecords, overview.totalRecords])

  return (
    <PageShell
      title="Trung tâm điều hành"
      description="Dashboard dùng các API mới: tổng quan, trạng thái, khoa phòng và hiệu suất người dùng."
      actions={
        <Button icon={<History size={17} />} onClick={() => navigate('/audit-logs')}>
          Nhật ký thao tác
        </Button>
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : (
        <>
          <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_28px_80px_-42px_rgba(15,23,42,0.8)]">
            <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-cyan-400/20 blur-3xl" />
            <div className="absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="relative grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <p className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100">
                  Tổng quan trực tiếp
                </p>
                <h2 className="mt-5 text-4xl font-bold tracking-tight">Hệ thống đang có {overview.totalRecords} hồ sơ</h2>
                <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                  Hôm nay có {overview.todayUploads} hồ sơ được upload và {overview.todayApprovals} hồ sơ được duyệt. Tỉ lệ hoàn tất hiện tại {reviewRate}%.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-sm text-slate-300">Chờ duyệt</p>
                  <p className="mt-2 text-3xl font-bold text-amber-200">{overview.pendingReviewRecords}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  <p className="text-sm text-slate-300">Bị từ chối</p>
                  <p className="mt-2 text-3xl font-bold text-rose-200">{overview.rejectedRecords}</p>
                </div>
              </div>
            </div>
          </section>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Tổng bệnh án" value={overview.totalRecords} icon={ClipboardList} tone="bg-indigo-500" />
            <MetricCard label="Bệnh nhân" value={overview.totalPatients} icon={HeartPulse} tone="bg-emerald-500" />
            <MetricCard label="Tài khoản" value={overview.totalAccounts} icon={Users} tone="bg-slate-800" />
            <MetricCard label="Đang OCR" value={overview.processingRecords} icon={Activity} tone="bg-sky-500" />
            <MetricCard label="OCR xong" value={overview.extractedRecords} icon={BarChart3} tone="bg-blue-500" />
            <MetricCard label="Chờ duyệt" value={overview.pendingReviewRecords} icon={FileClock} tone="bg-amber-500" />
            <MetricCard label="Đã duyệt" value={overview.approvedRecords} icon={FileCheck2} tone="bg-teal-500" />
            <MetricCard label="Từ chối" value={overview.rejectedRecords} icon={FileX2} tone="bg-rose-500" />
          </div>

          <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Trạng thái hồ sơ</h2>
                  <p className="text-sm text-slate-500">Đếm theo trạng thái backend trả về</p>
                </div>
                <Tag color="blue">records-by-status</Tag>
              </div>
              <MiniBars items={statusItems} accent="bg-indigo-500" />
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
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
              ]}
            />
          </section>
        </>
      )}
    </PageShell>
  )
}
