import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button, Descriptions, Empty, Input, Table } from 'antd'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { patientApi } from '../../api/patient.api'
import PageShell from '../../components/PageShell'

export default function PatientSearchPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [bhyt, setBhyt] = useState(searchParams.get('bhyt') ?? '')
  const [submittedBhyt, setSubmittedBhyt] = useState(searchParams.get('bhyt') ?? '')

  useEffect(() => {
    const value = searchParams.get('bhyt') ?? ''
    setBhyt(value)
    setSubmittedBhyt(value)
  }, [searchParams])

  const { data, isFetching } = useQuery({
    enabled: Boolean(submittedBhyt),
    queryKey: ['patient-search', submittedBhyt],
    queryFn: () => patientApi.searchByBhyt(submittedBhyt).then((response) => response.data.data),
  })

  return (
    <PageShell
      title="Tra cứu BHYT"
      description="Tìm bệnh nhân theo số thẻ BHYT và xem lịch sử bệnh án liên quan."
    >
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <Input
            size="large"
            value={bhyt}
            placeholder="Nhập số thẻ BHYT"
            onChange={(event) => setBhyt(event.target.value)}
            onPressEnter={() => setSubmittedBhyt(bhyt.trim())}
          />
          <Button type="primary" size="large" loading={isFetching} onClick={() => setSubmittedBhyt(bhyt.trim())}>
            Tra cứu
          </Button>
        </div>
      </section>

      {data ? (
        <>
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Thông tin bệnh nhân</h2>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Tên">{data.patient.name}</Descriptions.Item>
              <Descriptions.Item label="BHYT">{data.patient.bhyt}</Descriptions.Item>
              <Descriptions.Item label="Ngày sinh">
                {data.patient.dob ? new Date(data.patient.dob).toLocaleDateString('vi-VN') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Giới tính">{data.patient.gender ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ">{data.patient.address ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">{data.patient.phone ?? '-'}</Descriptions.Item>
            </Descriptions>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Lịch sử bệnh án</h2>
            <Table
              rowKey="id"
              pagination={false}
              dataSource={data.records}
              columns={[
                { title: 'Mã bệnh án', dataIndex: 'recordNumber' },
                { title: 'Khoa', dataIndex: 'department', render: (value: string | null) => value ?? '-' },
                { title: 'Loại hồ sơ', dataIndex: 'recordType', render: (value: string | null) => value ?? '-' },
                { title: 'Trạng thái', dataIndex: 'status' },
                {
                  title: 'Ngày tạo',
                  dataIndex: 'createdAt',
                  render: (value: string) => new Date(value).toLocaleString('vi-VN'),
                },
                {
                  title: 'Thao tác',
                  render: (_, item: { id: number }) => (
                    <Button type="link" onClick={() => navigate(`/medical-records/${item.id}`)}>
                      Xem chi tiết
                    </Button>
                  ),
                },
              ]}
            />
          </section>
        </>
      ) : (
        <section className="rounded-[28px] border border-slate-200 bg-white p-10 shadow-sm">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={submittedBhyt ? 'Không tìm thấy bệnh nhân phù hợp.' : 'Nhập số thẻ BHYT để bắt đầu tra cứu.'}
          />
        </section>
      )}
    </PageShell>
  )
}
