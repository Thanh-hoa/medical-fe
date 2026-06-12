import { Card, Empty, Statistic } from 'antd'
import { ClipboardList, FileClock, HeartPulse, Users } from 'lucide-react'
import { useQueries } from '@tanstack/react-query'
import PageShell from '../../components/PageShell'
import { accountApi } from '../../api/account.api'
import { medicalRecordApi } from '../../api/medicalRecord.api'
import { patientApi } from '../../api/patient.api'
import { usePermission, useRole } from '../../hooks/usePermission'

const cards = [
  {
    key: 'records',
    title: 'Tổng bệnh án',
    icon: ClipboardList,
    gradient: 'from-indigo-500 via-indigo-500 to-sky-500',
  },
  {
    key: 'pending',
    title: 'Chờ duyệt',
    icon: FileClock,
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
  },
  {
    key: 'patients',
    title: 'Bệnh nhân',
    icon: HeartPulse,
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
  },
  {
    key: 'accounts',
    title: 'Tài khoản',
    icon: Users,
    gradient: 'from-slate-700 via-slate-800 to-slate-950',
  },
]

export default function DashboardPage() {
  const role = useRole()
  const canSeeAccounts = usePermission('accounts:view')
  const results = useQueries({
    queries: [
      { queryKey: ['dashboard', 'records'], queryFn: () => medicalRecordApi.list({ page: 1, limit: 1 }).then((r) => r.data.data) },
      {
        queryKey: ['dashboard', 'pending'],
        queryFn: () => medicalRecordApi.pendingReview({ page: 1, limit: 1 }).then((r) => r.data.data),
      },
      { queryKey: ['dashboard', 'patients'], queryFn: () => patientApi.list({ page: 1, limit: 1 }).then((r) => r.data.data) },
      {
        enabled: canSeeAccounts,
        queryKey: ['dashboard', 'accounts'],
        queryFn: () => accountApi.list({ page: 1, limit: 1 }).then((r) => r.data.data),
      },
    ],
  })

  const totals = {
    records: results[0].data?.totalItems ?? 0,
    pending: results[1].data?.totalItems ?? 0,
    patients: results[2].data?.totalItems ?? 0,
    accounts: canSeeAccounts ? results[3].data?.totalItems ?? 0 : 0,
  }

  return (
    <PageShell
      title="Dashboard"
      description="Tổng quan nhanh các đối tượng chính trong hệ thống. Số liệu dùng các endpoint danh sách hiện có của backend."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ key, title, icon: Icon, gradient }) => (
          <Card
            key={key}
            variant="borderless"
            className={`overflow-hidden rounded-[28px] bg-gradient-to-br ${gradient} text-white shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)]`}
            styles={{ body: { padding: 24 } }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-white/70">{title}</p>
                <Statistic
                  value={totals[key as keyof typeof totals]}
                  valueStyle={{ color: 'white', fontWeight: 700, fontSize: '2rem' }}
                />
              </div>
              <div className="grid size-12 place-items-center rounded-2xl bg-white/15 text-white">
                <Icon size={22} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Nhận định vận hành</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">Vai trò hiện tại</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{role ?? 'Chưa xác định'}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Vai trò được lấy từ hồ sơ người dùng và menu phân quyền từ backend.</p>
            </article>
            <article className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-500">Trạng thái ưu tiên</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{totals.pending}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">Số lượng bệnh án ở trạng thái PENDING_DOCTOR_REVIEW cần bác sĩ xử lý.</p>
            </article>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Ghi chú</h2>
          <div className="mt-6">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Backend chưa có endpoint dashboard chuyên biệt, nên màn này đang dựng từ các endpoint danh sách."
            />
          </div>
        </section>
      </div>
    </PageShell>
  )
}
