import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App, Button, Descriptions, Empty, Table, Tag } from 'antd'
import { Edit3, FileText, History, UsersRound } from 'lucide-react'
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
  const canEdit = usePermission('patient-search:edit')
  const [searchParams, setSearchParams] = useSearchParams()
  const [submittedIdentifier, setSubmittedIdentifier] = useState(searchParams.get('identifier') ?? searchParams.get('bhyt') ?? '')
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)

  const { data, isError, error } = useQuery({
    enabled: Boolean(submittedIdentifier),
    queryKey: ['patient-search', submittedIdentifier],
    queryFn: () => patientApi.searchByIdentifier(submittedIdentifier).then((response) => response.data.data),
    retry: false,
  })

  const updateMutation = useMutation({
    mutationFn: ({ patient, payload }: { patient: Patient; payload: UpsertPatientPayload }) =>
      patientApi.update(patient.id, { id: patient.id, ...payload }),
    onSuccess: async (response) => {
      message.success(response.data.message || 'Cập nhật bệnh nhân thành công')
      setEditingPatient(null)
      const nextIdentifier = response.data.data.bhyt || response.data.data.citizenId || submittedIdentifier
      setSubmittedIdentifier(nextIdentifier)
      setSearchParams({ identifier: nextIdentifier })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['patient-search'] }),
        queryClient.invalidateQueries({ queryKey: ['patients'] }),
      ])
    },
    onError: (mutationError) => message.error(getApiMessage(mutationError, 'Cập nhật bệnh nhân thất bại')),
  })

  const emptyDescription = isError
    ? getApiMessage(error, 'Không tìm thấy bệnh nhân phù hợp.')
    : submittedIdentifier
      ? 'Không tìm thấy bệnh nhân phù hợp.'
      : 'Nhập số BHYT hoặc CCCD để bắt đầu tra cứu.'

  return (
    <PageShell
      title="Chi tiết bệnh nhân"
      description="Tra cứu theo số BHYT hoặc CCCD, xem thông tin bệnh nhân và lịch sử bệnh án liên quan."
      actions={
        <Button icon={<UsersRound size={17} />} onClick={() => navigate('/patients')}>
          Quay lại danh sách
        </Button>
      }
    >
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
        <div className="space-y-5">
          <div>
            {data ? (
              <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Bệnh nhân</p>
                    <h3 className="mt-1 text-2xl font-semibold text-slate-950">{data.patient.name}</h3>
                  </div>
                  {canEdit ? (
                    <Button icon={<Edit3 size={15} />} onClick={() => setEditingPatient(data.patient)}>
                      Cập nhật
                    </Button>
                  ) : null}
                </div>

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
            ) : submittedIdentifier || isError ? (
              <div className="mt-6 rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription} />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {data ? (
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
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
                      className="font-semibold text-slate-950 transition hover:text-[#2563EB]"
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
