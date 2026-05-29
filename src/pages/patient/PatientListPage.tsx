import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Input, Table } from 'antd'
import { useNavigate } from 'react-router-dom'
import { patientApi } from '../../api/patient.api'
import PageShell from '../../components/PageShell'
import type { Patient } from '../../types/patient.types'

export default function PatientListPage() {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({ q: '', page: 1, limit: 10 })

  const { data, isLoading } = useQuery({
    queryKey: ['patients', filters],
    queryFn: () => patientApi.list(filters).then((response) => response.data.data),
  })

  return (
    <PageShell
      title="Danh sách bệnh nhân"
      description="Tra cứu nhanh hồ sơ bệnh nhân và chuyển sang trang search theo số thẻ BHYT."
    >
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <Input.Search
          allowClear
          placeholder="Tìm theo tên hoặc số BHYT"
          className="mb-5 max-w-sm"
          onSearch={(q) => setFilters((prev) => ({ ...prev, q, page: 1 }))}
        />

        <Table<Patient>
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
            { title: 'Tên', dataIndex: 'name' },
            { title: 'BHYT', dataIndex: 'bhyt' },
            { title: 'Ngày sinh', render: (_, item) => (item.dob ? new Date(item.dob).toLocaleDateString('vi-VN') : '-') },
            { title: 'Giới tính', dataIndex: 'gender', render: (value: string | null) => value ?? '-' },
            { title: 'SĐT', dataIndex: 'phone', render: (value: string | null) => value ?? '-' },
            {
              title: 'Ngày tạo',
              dataIndex: 'createdAt',
              render: (value: string) => new Date(value).toLocaleDateString('vi-VN'),
            },
            {
              title: 'Thao tác',
              render: (_, item) => (
                <Button type="link" onClick={() => navigate(`/patients/search?bhyt=${encodeURIComponent(item.bhyt)}`)}>
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
