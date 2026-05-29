import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Input, Select, Space, Table } from 'antd'
import { useNavigate } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import StatusBadge from '../../components/StatusBadge'
import { medicalRecordApi } from '../../api/medicalRecord.api'
import { usePermission } from '../../hooks/usePermission'
import type { MedicalRecordSummary, RecordStatus } from '../../types/medicalRecord.types'

const statusOptions = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'Processing', label: 'Đang xử lý' },
  { value: 'Extracted', label: 'OCR xong' },
  { value: 'Pending Doctor Review', label: 'Chờ duyệt' },
  { value: 'Approved', label: 'Đã duyệt' },
  { value: 'Rejected', label: 'Từ chối' },
]

export default function MedicalRecordListPage() {
  const navigate = useNavigate()
  const canCreate = usePermission('medical-records:create')
  const [filters, setFilters] = useState({ q: '', status: '', page: 1, limit: 10 })

  const { data, isLoading } = useQuery({
    queryKey: ['medical-records', filters],
    queryFn: () => medicalRecordApi.list(filters).then((response) => response.data.data),
  })

  return (
    <PageShell
      title="Danh sách bệnh án"
      description="Danh sách dùng endpoint phân trang của backend. Backend tự giới hạn bệnh án theo role của người dùng."
      actions={
        canCreate ? (
          <Button type="primary" size="large" onClick={() => navigate('/medical-records/upload')}>
            Upload bệnh án
          </Button>
        ) : null
      }
    >
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <Space wrap className="mb-5">
          <Input.Search
            placeholder="Tìm theo tên bệnh nhân, mã bệnh án..."
            allowClear
            onSearch={(q) => setFilters((prev) => ({ ...prev, q, page: 1 }))}
            className="min-w-72"
          />
          <Select
            className="min-w-60"
            options={statusOptions}
            value={filters.status}
            onChange={(status) => setFilters((prev) => ({ ...prev, status, page: 1 }))}
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
            { title: 'Mã bệnh án', dataIndex: 'recordNumber', width: 180 },
            { title: 'Bệnh nhân', render: (_, record) => record.patient?.name ?? 'Chưa liên kết' },
            { title: 'BHYT', render: (_, record) => record.patient?.bhyt ?? '-' },
            { title: 'Khoa', dataIndex: 'department', render: (value: string | null) => value ?? '-' },
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
              render: (_, record) => (
                <Button type="link" onClick={() => navigate(`/medical-records/${record.id}`)}>
                  Xem chi tiết
                </Button>
              ),
            },
          ]}
        />
      </div>
    </PageShell>
  )
}
