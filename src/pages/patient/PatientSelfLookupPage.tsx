import { useMutation, useQuery } from '@tanstack/react-query'
import { Alert, App, Button, Descriptions, Empty, Form, Input, Spin, Table, Tag } from 'antd'
import { FileText, History, Search, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { patientApi } from '../../api/patient.api'
import PageShell from '../../components/PageShell'
import StatusBadge from '../../components/StatusBadge'
import { normalizeRecordStatus } from '../../types/medicalRecord.types'
import type { PatientRecordSummary } from '../../types/patient.types'

const IDENTIFIER_REQUIRED_MESSAGE = 'Vui lòng nhập số BHYT hoặc CCCD để tra cứu bệnh án'

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : '-'
}

function getApiMessage(error: unknown, fallback: string) {
  const apiError = error as { response?: { data?: { message?: string } } }
  return apiError.response?.data?.message ?? fallback
}

function getApiErrorKey(error: unknown) {
  const apiError = error as { response?: { data?: { key?: string; code?: string; errorCode?: string } } }
  return apiError.response?.data?.key ?? apiError.response?.data?.code ?? apiError.response?.data?.errorCode
}

function isIdentifierRequired(error: unknown) {
  return getApiErrorKey(error) === 'patient.self.identifier_required' || getApiMessage(error, '') === IDENTIFIER_REQUIRED_MESSAGE
}

export default function PatientSelfLookupPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const initialQuery = useQuery({
    queryKey: ['patient-me'],
    queryFn: () => patientApi.getMe().then((response) => response.data.data),
    retry: false,
  })

  const lookupMutation = useMutation({
    mutationFn: (identifier: string) => patientApi.getMe(identifier).then((response) => response.data.data),
    onSuccess: () => {
      message.success('Tra cứu bệnh án thành công')
    },
    onError: (error) => {
      message.error(getApiMessage(error, 'Tra cứu bệnh án thất bại'))
    },
  })

  const data = lookupMutation.data ?? initialQuery.data
  const initialError = initialQuery.isError ? initialQuery.error : null
  const needsIdentifier = Boolean(initialError && isIdentifierRequired(initialError) && !data)
  const blockingError = !data && initialError && !needsIdentifier ? getApiMessage(initialError, 'Không thể tải bệnh án của tôi') : null

  return (
    <PageShell title="Bệnh án của tôi" description="Thông tin bệnh nhân và các bệnh án đã liên kết với tài khoản hiện tại.">
      {initialQuery.isPending ? (
        <section className="grid min-h-72 place-items-center rounded-[28px] border border-slate-200 bg-white p-10 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
          <Spin />
        </section>
      ) : null}

      {needsIdentifier ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#C9D6F0] bg-[#EFF6FF] p-4 text-[#1D4ED8]">
            <ShieldCheck className="mt-0.5 shrink-0" size={20} />
            <div>
              <h2 className="font-semibold text-slate-950">Xác minh hồ sơ bệnh nhân</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Nhập số BHYT hoặc CCCD của chính bạn để liên kết hồ sơ lần đầu.</p>
            </div>
          </div>

          <Form
            layout="vertical"
            requiredMark={false}
            onFinish={({ identifier }) => {
              const value = String(identifier ?? '').trim()
              if (!value) {
                message.warning('Vui lòng nhập số BHYT hoặc CCCD')
                return
              }
              lookupMutation.mutate(value)
            }}
          >
            <Form.Item name="identifier" label="Số BHYT hoặc CCCD" rules={[{ required: true, message: 'Nhập số BHYT hoặc CCCD' }]}>
              <Input size="large" placeholder="Số BHYT hoặc CCCD" />
            </Form.Item>

            <Button type="primary" htmlType="submit" icon={<Search size={16} />} loading={lookupMutation.isPending}>
              Tra cứu
            </Button>
          </Form>
        </section>
      ) : null}

      {blockingError ? (
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
          <Alert type="error" showIcon message={blockingError} />
        </section>
      ) : null}

      {data ? (
        <>
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Bệnh nhân</p>
              <h2 className="mt-1 text-2xl font-semibold text-slate-950">{data.patient.name}</h2>

              <Descriptions className="mt-5" bordered column={{ xs: 1, md: 2 }}>
                <Descriptions.Item label="BHYT">{data.patient.bhyt ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="CCCD">{data.patient.citizenId ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Giới tính">{data.patient.gender ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Ngày sinh">{formatDate(data.patient.dob)}</Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">{data.patient.phone ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Địa chỉ" span={2}>
                  {data.patient.address ?? '-'}
                </Descriptions.Item>
              </Descriptions>
            </div>
          </section>

          <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
                  <History size={21} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Bệnh án gần đây</h2>
                  <p className="text-sm text-slate-500">Tối đa 10 bệnh án mới nhất.</p>
                </div>
              </div>
              <Tag color="geekblue">{data.totalRecords} hồ sơ</Tag>
            </div>

            <div className="p-5">
              <Table<PatientRecordSummary>
                rowKey="id"
                pagination={false}
                dataSource={data.records}
                onRow={(item) => ({
                  onClick: () => navigate(`/my-medical-records/${item.id}`),
                  className: 'cursor-pointer',
                })}
                locale={{
                  emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bạn chưa có bệnh án." />,
                }}
                columns={[
                  {
                    title: 'Mã bệnh án',
                    dataIndex: 'recordNumber',
                    render: (value: string, item) => (
                      <button
                        type="button"
                        className="font-semibold text-slate-950 transition hover:text-[#2563EB]"
                        onClick={(event) => {
                          event.stopPropagation()
                          navigate(`/my-medical-records/${item.id}`)
                        }}
                      >
                        {value}
                      </button>
                    ),
                  },
                  { title: 'Khoa', dataIndex: 'department', render: (value: string | null) => value ?? '-' },
                  { title: 'Người ký', dataIndex: 'signerName', render: (value: string | null) => value ?? '-' },
                  {
                    title: 'Chẩn đoán',
                    dataIndex: 'diagnosis',
                    ellipsis: true,
                    render: (value: string | null) => value ?? '-',
                  },
                  {
                    title: 'Trạng thái',
                    dataIndex: 'status',
                    render: (status: string) => <StatusBadge status={normalizeRecordStatus(status)} />,
                  },
                  {
                    title: 'Thao tác',
                    width: 150,
                    render: (_, item) => (
                      <Button
                        icon={<FileText size={15} />}
                        onClick={(event) => {
                          event.stopPropagation()
                          navigate(`/my-medical-records/${item.id}`)
                        }}
                      >
                        Mở hồ sơ
                      </Button>
                    ),
                  },
                ]}
              />
            </div>
          </section>
        </>
      ) : null}
    </PageShell>
  )
}
