import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Input, Table, Tag } from 'antd'
import { Clock3, Search, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import StatusBadge from '../../components/StatusBadge'
import { medicalRecordApi } from '../../api/medicalRecord.api'
import type { MedicalRecordSummary } from '../../types/medicalRecord.types'

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

export default function MedicalRecordApprovalPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ q: '', page: 1, limit: 10 })

  const { data, isLoading } = useQuery({
    queryKey: ['medical-records-approval', filters],
    queryFn: () => medicalRecordApi.pendingReview(filters).then((response) => response.data.data),
  })

  return (
    <PageShell
      title="Hàng đợi phê duyệt"
      description="Danh sách bệnh án đang ở trạng thái PENDING_DOCTOR_REVIEW, được backend sắp xếp theo hồ sơ chờ lâu nhất trước."
      actions={
        <Button icon={<ShieldCheck size={17} />} type="primary" onClick={() => navigate('/medical-records')}>
          Tất cả bệnh án
        </Button>
      }
    >
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
        <div className="flex flex-col gap-4 border-b border-slate-100 bg-white p-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-200">
              <Clock3 size={22} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Cần bác sĩ xử lý</p>
              <p className="text-3xl font-semibold text-slate-950">{data?.totalItems ?? 0}</p>
            </div>
          </div>
          <Input
            prefix={<Search size={16} className="text-slate-400" />}
            allowClear
            className="max-w-md"
            placeholder="Tìm theo mã bệnh án hoặc tên file"
            value={filters.q}
            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value, page: 1 }))}
          />
        </div>

        <div className="p-5">
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
                title: 'Thông tin hồ sơ',
                render: (_, record) => (
                  <div className="space-y-1">
                    <p>{record.department ?? '-'}</p>
                    {record.recordType ? <Tag color="gold">{record.recordType}</Tag> : null}
                  </div>
                ),
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                render: (status) => <StatusBadge status={status} />,
              },
              {
                title: 'Ngày tạo',
                dataIndex: 'createdAt',
                render: (value: string) => new Date(value).toLocaleString('vi-VN'),
              },
              {
                title: 'Duyệt',
                width: 140,
                render: (_, record) => (
                  <Button type="primary" onClick={() => navigate(`/medical-records/${record.id}`)}>
                    Xem & duyệt
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
