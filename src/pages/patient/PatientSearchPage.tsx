import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App, Button, Descriptions, Empty, Input, Space, Table, Tag } from 'antd'
import { Edit3, FileText, HeartPulse, History, Search, UserRoundCheck, UsersRound } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { patientApi } from '../../api/patient.api'
import PageShell from '../../components/PageShell'
import StatusBadge from '../../components/StatusBadge'
import { usePermission } from '../../hooks/usePermission'
import { normalizeRecordStatus } from '../../types/medicalRecord.types'
import type { Patient, PatientRecordSummary, UpsertPatientPayload } from '../../types/patient.types'
import PatientFormModal from './PatientFormModal'

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : '-'
}

function getApiMessage(error: unknown, fallback: string) {
  const apiError = error as { response?: { data?: { message?: string } } }
  return apiError.response?.data?.message ?? fallback
}

export default function PatientSearchPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const canCreate = usePermission('patient-search:create')
  const canEdit = usePermission('patient-search:edit')
  const [searchParams, setSearchParams] = useSearchParams()
  const [bhyt, setBhyt] = useState(searchParams.get('bhyt') ?? '')
  const [submittedBhyt, setSubmittedBhyt] = useState(searchParams.get('bhyt') ?? '')
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)

  const { data, isFetching, isError, error } = useQuery({
    enabled: Boolean(submittedBhyt),
    queryKey: ['patient-search', submittedBhyt],
    queryFn: () => patientApi.searchByBhyt(submittedBhyt).then((response) => response.data.data),
    retry: false,
  })

  const updateMutation = useMutation({
    mutationFn: ({ patient, payload }: { patient: Patient; payload: UpsertPatientPayload }) =>
      patientApi.update(patient.id, { id: patient.id, ...payload }),
    onSuccess: async (response) => {
      message.success(response.data.message || 'Cập nhật bệnh nhân thành công')
      setEditingPatient(null)
      const nextBhyt = response.data.data.bhyt
      setBhyt(nextBhyt)
      setSubmittedBhyt(nextBhyt)
      setSearchParams({ bhyt: nextBhyt })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['patient-search'] }),
        queryClient.invalidateQueries({ queryKey: ['patients'] }),
      ])
    },
    onError: (mutationError) => message.error(getApiMessage(mutationError, 'Cập nhật bệnh nhân thất bại')),
  })

  const submitSearch = () => {
    const value = bhyt.trim()
    setSubmittedBhyt(value)

    if (value) {
      setSearchParams({ bhyt: value })
      return
    }

    setSearchParams({})
  }

  const emptyDescription = isError
    ? getApiMessage(error, 'Không tìm thấy bệnh nhân phù hợp.')
    : submittedBhyt
      ? 'Không tìm thấy bệnh nhân phù hợp.'
      : 'Nhập số thẻ BHYT để bắt đầu tra cứu.'

  return (
    <PageShell
      title="Tra cứu BHYT"
      description="Tra cứu chính xác theo số thẻ BHYT, xem thông tin bệnh nhân và các bệnh án gần nhất."
      actions={
        <Space wrap>
          <Button icon={<UsersRound size={17} />} onClick={() => navigate('/patients')}>
            Danh sách
          </Button>
          {canCreate ? (
            <Button type="primary" icon={<UserRoundCheck size={17} />} onClick={() => navigate('/patients')}>
              Tạo bệnh nhân
            </Button>
          ) : null}
        </Space>
      }
    >
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="border-b border-slate-100 bg-gradient-to-br from-indigo-600 via-sky-600 to-emerald-500 p-6 text-white lg:border-r lg:border-b-0">
            <div className="grid size-14 place-items-center rounded-3xl bg-white/15">
              <HeartPulse size={26} />
            </div>
            <h2 className="mt-8 text-2xl font-semibold">Tìm hồ sơ bệnh nhân</h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
              Số thẻ BHYT là định danh chính. Kết quả trả về gồm thông tin cá nhân và tối đa 20 bệnh án gần nhất.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-white/15 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/70">Bệnh án</p>
                <p className="mt-2 text-2xl font-semibold">{data?.totalRecords ?? 0}</p>
              </div>
              <div className="rounded-3xl bg-white/15 p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/70">Hiển thị</p>
                <p className="mt-2 text-2xl font-semibold">{data?.records.length ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                size="large"
                allowClear
                prefix={<Search size={17} className="text-slate-400" />}
                value={bhyt}
                placeholder="Nhập số thẻ BHYT"
                onChange={(event) => setBhyt(event.target.value)}
                onPressEnter={submitSearch}
              />
              <Button type="primary" size="large" icon={<Search size={18} />} loading={isFetching} onClick={submitSearch}>
                Tra cứu
              </Button>
            </div>

            {data ? (
              <div className="mt-6 rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Bệnh nhân</p>
                    <h3 className="mt-1 text-2xl font-semibold text-slate-950">{data.patient.name}</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Tag color="blue">{data.patient.bhyt}</Tag>
                      {data.patient.gender ? <Tag color="green">{data.patient.gender}</Tag> : null}
                    </div>
                  </div>
                  {canEdit ? (
                    <Button icon={<Edit3 size={15} />} onClick={() => setEditingPatient(data.patient)}>
                      Cập nhật
                    </Button>
                  ) : null}
                </div>

                <Descriptions className="mt-5" bordered column={{ xs: 1, md: 2 }}>
                  <Descriptions.Item label="Ngày sinh">{formatDate(data.patient.dob)}</Descriptions.Item>
                  <Descriptions.Item label="Số điện thoại">{data.patient.phone ?? '-'}</Descriptions.Item>
                  <Descriptions.Item label="Địa chỉ" span={2}>
                    {data.patient.address ?? '-'}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />
              </div>
            )}
          </div>
        </div>
      </section>

      {data ? (
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                <History size={21} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Lịch sử bệnh án</h2>
                <p className="text-sm text-slate-500">Danh sách tóm tắt theo API tra cứu bệnh nhân.</p>
              </div>
            </div>
            <Tag color="geekblue">{data.totalRecords} hồ sơ</Tag>
          </div>

          <div className="p-5">
            <Table<PatientRecordSummary>
              rowKey="id"
              pagination={false}
              dataSource={data.records}
              locale={{
                emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Bệnh nhân chưa có bệnh án." />,
              }}
              columns={[
                {
                  title: 'Mã bệnh án',
                  dataIndex: 'recordNumber',
                  render: (value: string, item) => (
                    <button
                      type="button"
                      className="font-semibold text-slate-950 transition hover:text-indigo-600"
                      onClick={() => navigate(`/medical-records/${item.id}`)}
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
                    <Button icon={<FileText size={15} />} onClick={() => navigate(`/medical-records/${item.id}`)}>
                      Mở hồ sơ
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </section>
      ) : null}

      <PatientFormModal
        open={Boolean(editingPatient)}
        mode="edit"
        patient={editingPatient}
        loading={updateMutation.isPending}
        onCancel={() => setEditingPatient(null)}
        onSubmit={(payload) => editingPatient && updateMutation.mutate({ patient: editingPatient, payload })}
      />
    </PageShell>
  )
}
