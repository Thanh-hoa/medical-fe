import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Input, Select, Space, Table, Tag } from 'antd'
import { FilePlus2, Search, Send, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import StatusBadge from '../../components/StatusBadge'
import { medicalRecordApi } from '../../api/medicalRecord.api'
import { usePermission } from '../../hooks/usePermission'
import { normalizeRecordStatus, type MedicalRecordSummary, type RecordStatus } from '../../types/medicalRecord.types'

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PROCESSING', label: 'Đang xử lý OCR' },
  { value: 'EXTRACTED', label: 'OCR xong, chờ kiểm tra' },
  { value: 'PENDING_DOCTOR_REVIEW', label: 'Chờ bác sĩ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'REJECTED', label: 'Bị từ chối' },
]

function PatientIdentifier({ patient }: { patient: MedicalRecordSummary['patient'] }) {
  if (patient?.bhyt) {
    return (
      <span className="inline-flex items-center gap-2">
        <Tag color="blue" className="m-0">BHYT</Tag>
        <span>{patient.bhyt}</span>
      </span>
    )
  }

  if (patient?.citizenId) {
    return (
      <span className="inline-flex items-center gap-2">
        <Tag color="geekblue" className="m-0">CCCD</Tag>
        <span>{patient.citizenId}</span>
      </span>
    )
  }

  return <span>-</span>
}

export default function MedicalRecordListPage() {
  const navigate = useNavigate()
  const canCreate = usePermission('medical-records:create')
  const canApproval = usePermission('medical-records-approval:create')
  const [filters, setFilters] = useState({
    q: '',
    status: '',
    page: 1,
    limit: 10,
    sort_by: 'created_at' as const,
    order_by: 'desc' as const,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['medical-records', filters],
    queryFn: () => medicalRecordApi.list(filters).then((response) => response.data.data),
  })

  const totals = useMemo(() => {
    const items = data?.items ?? []
    return {
      extracted: items.filter((item) => normalizeRecordStatus(item.status) === 'EXTRACTED').length,
      pending: items.filter((item) => normalizeRecordStatus(item.status) === 'PENDING_DOCTOR_REVIEW').length,
      approved: items.filter((item) => normalizeRecordStatus(item.status) === 'APPROVED').length,
      rejected: items.filter((item) => normalizeRecordStatus(item.status) === 'REJECTED').length,
    }
  }, [data?.items])

  return (
    <PageShell
      title="Hồ sơ bệnh án"
      description="Theo dõi bệnh án từ lúc OCR xong, kiểm tra dữ liệu, gửi duyệt, từ chối và nộp lại."
      actions={
        <>
          {canApproval ? (
            <Button icon={<ShieldCheck size={17} />} onClick={() => navigate('/medical-records-approval')}>
              Hàng đợi duyệt
            </Button>
          ) : null}
          {canCreate ? (
            <Button
              type="primary"
              size="large"
              icon={<FilePlus2 size={18} />}
              onClick={() => navigate('/medical-records/upload')}
            >
              Upload bệnh án
            </Button>
          ) : null}
        </>
      }
    >
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
        <div className="grid gap-0 border-b border-slate-100 md:grid-cols-4">
          <div className="border-b border-slate-100 p-5 md:border-r md:border-b-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Cần kiểm tra</p>
            <p className="mt-2 text-3xl font-semibold text-blue-600">{totals.extracted}</p>
          </div>
          <div className="border-b border-slate-100 p-5 md:border-r md:border-b-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Đang chờ duyệt</p>
            <p className="mt-2 text-3xl font-semibold text-amber-600">{totals.pending}</p>
          </div>
          <div className="border-b border-slate-100 p-5 md:border-r md:border-b-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Đã hoàn tất</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-600">{totals.approved}</p>
          </div>
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Bị từ chối</p>
            <p className="mt-2 text-3xl font-semibold text-rose-600">{totals.rejected}</p>
          </div>
        </div>

        <div className="p-5">
          <Space wrap className="mb-5">
            <Input
              prefix={<Search size={16} className="text-slate-400" />}
              placeholder="Tìm theo mã bệnh án hoặc tên file"
              allowClear
              value={filters.q}
              onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value, page: 1 }))}
              className="min-w-72"
            />
            <Select
              className="min-w-64"
              options={statusOptions}
              value={filters.status}
              onChange={(status) => setFilters((prev) => ({ ...prev, status, page: 1 }))}
            />
            <Select
              className="min-w-44"
              value={filters.order_by}
              options={[
                { value: 'desc', label: 'Mới nhất trước' },
                { value: 'asc', label: 'Cũ nhất trước' },
              ]}
              onChange={(order_by) => setFilters((prev) => ({ ...prev, order_by, page: 1 }))}
            />
          </Space>

          <Table<MedicalRecordSummary>
            rowKey="id"
            loading={isLoading}
            dataSource={data?.items ?? []}
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total: data?.totalItems ?? 0,
              onChange: (page, pageSize) => setFilters((prev) => ({ ...prev, page, limit: pageSize })),
            }}
            columns={[
              {
                title: 'Mã bệnh án',
                dataIndex: 'recordNumber',
                width: 180,
                render: (value: string, record) => (
                  <button
                    type="button"
                    className="font-semibold text-slate-900 hover:text-[#2563EB]"
                    onClick={() => navigate(`/medical-records/${record.id}`)}
                  >
                    {value}
                  </button>
                ),
              },
              { title: 'Bệnh nhân', render: (_, record) => record.patient?.name ?? 'Chưa liên kết' },
              {
                title: 'Định danh',
                render: (_, record) => <PatientIdentifier patient={record.patient} />,
              },
              {
                title: 'Phân loại',
                render: (_, record) => (
                  <div className="space-y-1">
                    <p>{record.department ?? '-'}</p>
                    {record.recordType ? <Tag color="blue">{record.recordType}</Tag> : null}
                  </div>
                ),
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                render: (status: RecordStatus) => <StatusBadge status={status} />,
              },
              {
                title: 'Ngày tạo',
                dataIndex: 'createdAt',
                render: (value: string) => new Date(value).toLocaleString('vi-VN'),
              },
              {
                title: 'Thao tác',
                width: 150,
                render: (_, record) => (
                  <Button
                    type={normalizeRecordStatus(record.status) === 'EXTRACTED' ? 'primary' : 'default'}
                    icon={normalizeRecordStatus(record.status) === 'EXTRACTED' ? <Send size={15} /> : undefined}
                    onClick={() => navigate(`/medical-records/${record.id}`)}
                  >
                    Mở hồ sơ
                  </Button>
                ),
              },
            ]}
          />
        </div>
      </section>
    </PageShell>
  )
}
