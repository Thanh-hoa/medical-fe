import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  App,
  Alert,
  Button,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Skeleton,
  Table,
  Tabs,
  Timeline,
} from 'antd'
import { CheckCircle2, ClipboardCheck, PencilLine, RotateCcw, Send, Trash2, XCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import StatusBadge from '../../components/StatusBadge'
import { APP_BASE_URL } from '../../config/env'
import { usePermission } from '../../hooks/usePermission'
import { medicalRecordApi } from '../../api/medicalRecord.api'
import {
  normalizeRecordStatus,
  type ExtractedData,
  type MedicalRecordDetail,
  type UpdateMedicalRecordDetailPayload,
} from '../../types/medicalRecord.types'

type EditFormValues = {
  department?: string
  recordType?: string
  notes?: string
  patient?: {
    bhyt?: string
    name?: string
    dob?: string
    gender?: string
    address?: string
    phone?: string
  }
  extractedData?: {
    facility?: string
    department?: string
    signerName?: string
    diagnosis?: string
  }
}

const ocrLabels: Record<string, string> = {
  facility: 'Cơ sở y tế',
  department: 'Khoa/Phòng',
  signerName: 'Người ký',
  diagnosis: 'Chẩn đoán',
}

function normalizeExtractedData(data: ExtractedData | null) {
  if (!data) return []

  const rows = Object.entries(data)
    .filter(([key]) => key !== 'extra')
    .map(([fieldName, fieldValue]) => ({
      fieldName,
      label: ocrLabels[fieldName] ?? fieldName,
      fieldValue: typeof fieldValue === 'string' ? fieldValue : '',
    }))

  const extraRows = Object.entries(data.extra ?? {}).map(([fieldName, fieldValue]) => ({
    fieldName,
    label: fieldName,
    fieldValue,
  }))

  return [...rows, ...extraRows]
}

function buildInitialValues(record: MedicalRecordDetail): EditFormValues {
  return {
    department: record.department ?? undefined,
    recordType: record.recordType ?? undefined,
    notes: record.notes ?? undefined,
    patient: {
      bhyt: record.patient?.bhyt,
      name: record.patient?.name,
      dob: record.patient?.dob ?? undefined,
      gender: record.patient?.gender ?? undefined,
      address: record.patient?.address ?? undefined,
      phone: record.patient?.phone ?? undefined,
    },
    extractedData: {
      facility: typeof record.extractedData?.facility === 'string' ? record.extractedData.facility : undefined,
      department: typeof record.extractedData?.department === 'string' ? record.extractedData.department : undefined,
      signerName: typeof record.extractedData?.signerName === 'string' ? record.extractedData.signerName : undefined,
      diagnosis: typeof record.extractedData?.diagnosis === 'string' ? record.extractedData.diagnosis : undefined,
    },
  }
}

function buildUpdatePayload(record: MedicalRecordDetail, values: EditFormValues): UpdateMedicalRecordDetailPayload {
  const patient = values.patient?.bhyt && values.patient?.name
    ? {
        bhyt: values.patient.bhyt,
        name: values.patient.name,
        dob: values.patient.dob || null,
        gender: values.patient.gender || null,
        address: values.patient.address || null,
        phone: values.patient.phone || null,
      }
    : undefined

  return {
    id: record.id,
    department: values.department || null,
    recordType: values.recordType || null,
    notes: values.notes || null,
    patient,
    extractedData: {
      ...(record.extractedData ?? {}),
      ...(values.extractedData ?? {}),
    },
    labData: record.labData ?? [],
  }
}

export default function MedicalRecordDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const canDelete = usePermission('medical-records:delete')
  const canEdit = usePermission('medical-records:edit')
  const canApprovePermission = usePermission('medical-records-approval:create')
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [diagnosisDraft, setDiagnosisDraft] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm] = Form.useForm<EditFormValues>()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectForm] = Form.useForm<{ rejectionReason: string }>()

  const recordQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['record', id],
    queryFn: async () => {
      const response = await medicalRecordApi.detail(Number(id))
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
      return response.data.data
    },
  })

  const auditLogsQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['record', id, 'audit-logs'],
    queryFn: () => medicalRecordApi.auditLogs(Number(id), { page: 1, limit: 20 }).then((response) => response.data.data),
  })

  const record = recordQuery.data

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['record', id] })
    await queryClient.invalidateQueries({ queryKey: ['record', id, 'audit-logs'] })
    await queryClient.invalidateQueries({ queryKey: ['medical-records'] })
    await queryClient.invalidateQueries({ queryKey: ['medical-records-approval'] })
    await queryClient.invalidateQueries({ queryKey: ['notifications'] })
  }

  const submitMutation = useMutation({
    mutationFn: () => medicalRecordApi.submit(Number(id)),
    onSuccess: async () => {
      message.success('Đã gửi bệnh án để bác sĩ duyệt')
      await invalidate()
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Gửi duyệt thất bại'),
  })

  const approveMutation = useMutation({
    mutationFn: () => medicalRecordApi.approve(Number(id)),
    onSuccess: async () => {
      message.success('Đã duyệt bệnh án')
      await invalidate()
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Duyệt thất bại'),
  })

  const rejectMutation = useMutation({
    mutationFn: (values: { rejectionReason: string }) =>
      medicalRecordApi.reject(Number(id), values.rejectionReason),
    onSuccess: async () => {
      message.success('Đã từ chối bệnh án')
      setRejectOpen(false)
      rejectForm.resetFields()
      await invalidate()
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Từ chối thất bại'),
  })

  const resubmitMutation = useMutation({
    mutationFn: () => medicalRecordApi.resubmit(Number(id)),
    onSuccess: async () => {
      message.success('Đã nộp lại bệnh án')
      await invalidate()
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Nộp lại thất bại'),
  })

  const updateDetailMutation = useMutation({
    mutationFn: (values: EditFormValues) => {
      if (!record) throw new Error('Không có dữ liệu bệnh án')
      return medicalRecordApi.updateDetail(buildUpdatePayload(record, values))
    },
    onSuccess: async () => {
      message.success('Đã cập nhật chi tiết bệnh án')
      setEditOpen(false)
      await invalidate()
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Cập nhật thất bại'),
  })

  const updateFieldMutation = useMutation({
    mutationFn: (payload: { fieldName: string; fieldValue: string }) =>
      medicalRecordApi.updateField({
        recordId: Number(id),
        fieldName: payload.fieldName,
        fieldValue: payload.fieldValue,
      }),
    onSuccess: async () => {
      message.success('Đã cập nhật trường OCR')
      setEditingField(null)
      await invalidate()
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Cập nhật trường thất bại'),
  })

  const approveWithDiagnosisMutation = useMutation({
    mutationFn: async () => {
      const currentDiagnosis = typeof record?.extractedData?.diagnosis === 'string' ? record.extractedData.diagnosis : ''

      if (diagnosisDraft !== currentDiagnosis) {
        await medicalRecordApi.updateField({
          recordId: Number(id),
          fieldName: 'diagnosis',
          fieldValue: diagnosisDraft,
        })
      }

      return medicalRecordApi.approve(Number(id))
    },
    onSuccess: async () => {
      message.success('Đã lưu chẩn đoán và duyệt bệnh án')
      await invalidate()
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Lưu và duyệt thất bại'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => medicalRecordApi.delete(Number(id)),
    onSuccess: () => {
      message.success('Đã xóa bệnh án')
      void queryClient.invalidateQueries({ queryKey: ['medical-records'] })
      navigate('/medical-records')
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Xóa bệnh án thất bại'),
  })

  const recordStatus = normalizeRecordStatus(record?.status)
  const canSubmit = recordStatus === 'EXTRACTED'
  const canApprove = recordStatus === 'PENDING_DOCTOR_REVIEW' && canApprovePermission
  const canReject = recordStatus === 'PENDING_DOCTOR_REVIEW' && canApprovePermission
  const canResubmit = recordStatus === 'REJECTED' && canEdit
  const canOpenEdit = Boolean(record && canEdit && recordStatus !== 'APPROVED')
  const canEditDiagnosisForApproval = Boolean(canApprove)

  const imageUrl = useMemo(() => {
    if (!record?.originalImagePath) return null
    return record.originalImagePath.startsWith('http')
      ? record.originalImagePath
      : `${APP_BASE_URL}${record.originalImagePath}`
  }, [record?.originalImagePath])

  const ocrRows = useMemo(() => normalizeExtractedData(record?.extractedData ?? null), [record?.extractedData])

  useEffect(() => {
    if (!record) return
    setDiagnosisDraft(typeof record.extractedData?.diagnosis === 'string' ? record.extractedData.diagnosis : '')
  }, [record])

  if (recordQuery.isLoading) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  if (!record) {
    return <div className="rounded-[28px] border border-slate-200 bg-white p-8 text-sm text-slate-500">Không tìm thấy bệnh án.</div>
  }

  return (
    <>
      <PageShell
        title={record.recordNumber}
        description="Đối chiếu file gốc với dữ liệu OCR, cập nhật thông tin sai lệch, gửi bác sĩ duyệt và khóa hồ sơ ở trạng thái đã duyệt."
        actions={
          <>
            <StatusBadge status={record.status} />
            {canOpenEdit ? (
              <Button
                icon={<PencilLine size={17} />}
                onClick={() => {
                  editForm.setFieldsValue(buildInitialValues(record))
                  setEditOpen(true)
                }}
              >
                Sửa chi tiết
              </Button>
            ) : null}
            {canSubmit ? (
              <Button
                type="primary"
                icon={<Send size={17} />}
                loading={submitMutation.isPending}
                onClick={() => submitMutation.mutate()}
              >
                Gửi duyệt
              </Button>
            ) : null}
            {canResubmit ? (
              <Popconfirm
                title="Nộp lại bệnh án?"
                description="Hồ sơ sẽ quay lại trạng thái chờ bác sĩ duyệt."
                onConfirm={() => resubmitMutation.mutate()}
              >
                <Button type="primary" icon={<RotateCcw size={17} />} loading={resubmitMutation.isPending}>
                  Nộp lại
                </Button>
              </Popconfirm>
            ) : null}
            {canApprove ? (
              <Popconfirm
                title="Lưu chẩn đoán và duyệt bệnh án?"
                description="Sau khi duyệt, hồ sơ chuyển sang trạng thái cuối APPROVED."
                onConfirm={() => approveWithDiagnosisMutation.mutate()}
              >
                <Button
                  type="primary"
                  icon={<CheckCircle2 size={17} />}
                  loading={approveMutation.isPending || approveWithDiagnosisMutation.isPending}
                >
                  Lưu & duyệt
                </Button>
              </Popconfirm>
            ) : null}
            {canReject ? (
              <Button danger icon={<XCircle size={17} />} onClick={() => setRejectOpen(true)}>
                Từ chối
              </Button>
            ) : null}
            {canDelete ? (
              <Popconfirm title="Xóa vĩnh viễn bệnh án này?" onConfirm={() => deleteMutation.mutate()}>
                <Button danger icon={<Trash2 size={17} />} loading={deleteMutation.isPending}>
                  Xóa
                </Button>
              </Popconfirm>
            ) : null}
          </>
        }
      >
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="border-b border-slate-100 p-5 lg:border-r lg:border-b-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tài liệu gốc</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">{record.fileName}</h2>
                </div>
                <ClipboardCheck className="text-indigo-500" size={24} />
              </div>
              <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                {imageUrl && !record.fileType.includes('pdf') ? (
                  <img src={imageUrl} alt={record.fileName} className="max-h-[70vh] w-full object-contain" />
                ) : imageUrl ? (
                  <iframe src={imageUrl} title={record.fileName} className="h-[70vh] w-full border-0" />
                ) : (
                  <div className="grid min-h-96 place-items-center text-sm text-slate-400">
                    Backend chưa trả đường dẫn file gốc.
                  </div>
                )}
              </div>
            </div>

            <div className="p-5">
              {recordStatus === 'REJECTED' && record.rejectionReason ? (
                <Alert
                  className="mb-5"
                  type="error"
                  showIcon
                  message="Lý do từ chối"
                  description={
                    <div>
                      <p>{record.rejectionReason}</p>
                      {record.rejectedAt ? (
                        <p className="mt-2 text-xs text-slate-500">
                          Thời điểm: {new Date(record.rejectedAt).toLocaleString('vi-VN')}
                        </p>
                      ) : null}
                    </div>
                  }
                />
              ) : null}
              <Timeline
                className="mb-5"
                items={[
                  { color: 'green', children: 'Upload và OCR đồng bộ' },
                  { color: recordStatus === 'EXTRACTED' ? 'blue' : 'green', children: 'Nhân viên kiểm tra dữ liệu' },
                  {
                    color: recordStatus === 'PENDING_DOCTOR_REVIEW' ? 'orange' : recordStatus === 'APPROVED' ? 'green' : 'gray',
                    children: 'Gửi bác sĩ duyệt',
                  },
                  { color: recordStatus === 'APPROVED' ? 'green' : 'gray', children: 'Phê duyệt hoàn tất' },
                ]}
              />

              {canEditDiagnosisForApproval ? (
                <div className="mb-5 rounded-[24px] border border-amber-200 bg-amber-50/70 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-end">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-amber-900">Chẩn đoán duyệt</p>
                      <Input.TextArea
                        className="mt-2"
                        rows={3}
                        value={diagnosisDraft}
                        onChange={(event) => setDiagnosisDraft(event.target.value)}
                        placeholder="Nhập hoặc chỉnh chẩn đoán trước khi duyệt"
                      />
                    </div>
                    <Popconfirm
                      title="Lưu chẩn đoán và duyệt bệnh án?"
                      description="Hồ sơ sẽ chuyển sang APPROVED sau khi lưu."
                      onConfirm={() => approveWithDiagnosisMutation.mutate()}
                    >
                      <Button
                        type="primary"
                        icon={<CheckCircle2 size={17} />}
                        loading={approveWithDiagnosisMutation.isPending}
                      >
                        Lưu & duyệt bệnh án
                      </Button>
                    </Popconfirm>
                  </div>
                </div>
              ) : null}

              <Tabs
                items={[
                  {
                    key: 'patient',
                    label: 'Bệnh nhân',
                    children: (
                      <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Họ tên">{record.patient?.name ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="BHYT">{record.patient?.bhyt ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Ngày sinh">
                          {record.patient?.dob ? new Date(record.patient.dob).toLocaleDateString('vi-VN') : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Giới tính">{record.patient?.gender ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Địa chỉ">{record.patient?.address ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Số điện thoại">{record.patient?.phone ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Khoa">{record.department ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Loại bệnh án">{record.recordType ?? '-'}</Descriptions.Item>
                        <Descriptions.Item label="Ghi chú">{record.notes ?? '-'}</Descriptions.Item>
                      </Descriptions>
                    ),
                  },
                  {
                    key: 'ocr',
                    label: 'Dữ liệu OCR',
                    children: (
                      <Table
                        rowKey="fieldName"
                        pagination={false}
                        dataSource={ocrRows}
                        columns={[
                          {
                            title: 'Trường',
                            render: (_, row) => (
                              <div>
                                <p className="font-medium text-slate-900">{row.label}</p>
                                <p className="font-mono text-xs text-slate-400">{row.fieldName}</p>
                              </div>
                            ),
                          },
                          {
                            title: 'Giá trị',
                            render: (_, row) =>
                              editingField === row.fieldName ? (
                                <Input
                                  value={draftValue}
                                  onChange={(event) => setDraftValue(event.target.value)}
                                  onPressEnter={() => {
                                    if (row.fieldName === 'diagnosis') {
                                      setDiagnosisDraft(draftValue)
                                    }
                                    updateFieldMutation.mutate({ fieldName: row.fieldName, fieldValue: draftValue })
                                  }}
                                />
                              ) : (
                                <span>{row.fieldValue || '-'}</span>
                              ),
                          },
                          {
                            title: 'Thao tác',
                            width: 180,
                            render: (_, row) => {
                              const canEditThisField = canOpenEdit || (canEditDiagnosisForApproval && row.fieldName === 'diagnosis')

                              return canEditThisField ? (
                                editingField === row.fieldName ? (
                                  <div className="flex gap-2">
                                    <Button
                                      type="link"
                                      loading={updateFieldMutation.isPending}
                                      onClick={() => {
                                        if (row.fieldName === 'diagnosis') {
                                          setDiagnosisDraft(draftValue)
                                        }
                                        updateFieldMutation.mutate({ fieldName: row.fieldName, fieldValue: draftValue })
                                      }}
                                    >
                                      Lưu
                                    </Button>
                                    <Button type="link" onClick={() => setEditingField(null)}>
                                      Hủy
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    type="link"
                                    onClick={() => {
                                      setEditingField(row.fieldName)
                                      setDraftValue(row.fieldName === 'diagnosis' ? diagnosisDraft : row.fieldValue)
                                    }}
                                  >
                                    Sửa nhanh
                                  </Button>
                                )
                              ) : null
                            },
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'lab',
                    label: 'Xét nghiệm',
                    children: (
                      <Table
                        rowKey={(item) => `${item.testName}-${item.testValue}-${item.unit}`}
                        pagination={false}
                        dataSource={record.labData}
                        rowClassName={(item) => (item.isAbnormal ? '!bg-red-50' : '')}
                        columns={[
                          { title: 'Xét nghiệm', dataIndex: 'testName' },
                          { title: 'Giá trị', dataIndex: 'testValue' },
                          { title: 'Đơn vị', dataIndex: 'unit' },
                          { title: 'Khoảng tham chiếu', dataIndex: 'referenceRange' },
                          {
                            title: 'Đánh dấu',
                            render: (_, item) => (item.isAbnormal ? <span className="text-red-600">Bất thường</span> : 'Bình thường'),
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'audit',
                    label: 'Nhật ký thao tác',
                    children: (
                      <Timeline
                        pending={auditLogsQuery.isLoading ? 'Đang tải lịch sử...' : false}
                        items={(auditLogsQuery.data?.items ?? []).map((log) => ({
                          color: log.action === 'REJECT' ? 'red' : log.action === 'APPROVE' ? 'green' : 'blue',
                          children: (
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <p className="font-semibold text-slate-950">{log.actionLabel ?? log.action}</p>
                                  <p className="text-sm text-slate-500">{log.actorName ?? `Actor #${log.actorId ?? '-'}`}</p>
                                </div>
                                <span className="text-xs text-slate-400">
                                  {new Date(log.createdAt).toLocaleString('vi-VN')}
                                </span>
                              </div>
                              {log.newValue ? (
                                <pre className="mt-3 max-h-36 overflow-auto rounded-xl bg-slate-950 p-3 text-xs text-slate-100">
                                  {log.newValue}
                                </pre>
                              ) : null}
                            </div>
                          ),
                        }))}
                      />
                    ),
                  },
                ]}
              />
            </div>
          </div>
        </section>
      </PageShell>

      <Modal
        open={editOpen}
        title="Cập nhật chi tiết bệnh án"
        okText="Lưu thay đổi"
        cancelText="Hủy"
        width={860}
        confirmLoading={updateDetailMutation.isPending}
        onCancel={() => setEditOpen(false)}
        onOk={async () => {
          const values = await editForm.validateFields()
          updateDetailMutation.mutate(values)
        }}
      >
        <Form form={editForm} layout="vertical">
          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item name="department" label="Khoa/Phòng">
              <Input placeholder="Ví dụ: Xét nghiệm" />
            </Form.Item>
            <Form.Item name="recordType" label="Loại bệnh án">
              <Input placeholder="Ví dụ: Kết quả xét nghiệm máu" />
            </Form.Item>
          </div>
          <Form.Item name="notes" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú nội bộ" />
          </Form.Item>

          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item name={['patient', 'bhyt']} label="Mã BHYT" rules={[{ required: true, message: 'Nhập mã BHYT' }]}>
              <Input />
            </Form.Item>
            <Form.Item name={['patient', 'name']} label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
              <Input />
            </Form.Item>
            <Form.Item name={['patient', 'dob']} label="Ngày sinh">
              <Input placeholder="yyyy-MM-dd" />
            </Form.Item>
            <Form.Item name={['patient', 'gender']} label="Giới tính">
              <Input />
            </Form.Item>
            <Form.Item name={['patient', 'phone']} label="Số điện thoại">
              <Input />
            </Form.Item>
            <Form.Item name={['patient', 'address']} label="Địa chỉ">
              <Input />
            </Form.Item>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Form.Item name={['extractedData', 'facility']} label="Cơ sở y tế">
              <Input />
            </Form.Item>
            <Form.Item name={['extractedData', 'department']} label="Khoa/Phòng OCR">
              <Input />
            </Form.Item>
            <Form.Item name={['extractedData', 'signerName']} label="Người ký">
              <Input />
            </Form.Item>
            <Form.Item name={['extractedData', 'diagnosis']} label="Chẩn đoán">
              <Input.TextArea rows={2} />
            </Form.Item>
          </div>
        </Form>
      </Modal>

      <Modal
        open={rejectOpen}
        title="Từ chối bệnh án"
        okText="Xác nhận từ chối"
        okButtonProps={{ danger: true }}
        cancelText="Hủy"
        confirmLoading={rejectMutation.isPending}
        onCancel={() => setRejectOpen(false)}
        onOk={async () => {
          const values = await rejectForm.validateFields()
          rejectMutation.mutate(values)
        }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="rejectionReason"
            label="Lý do từ chối"
            rules={[
              { required: true, message: 'Nhập lý do từ chối' },
              { min: 8, message: 'Lý do cần rõ ràng hơn' },
            ]}
          >
            <Input.TextArea rows={5} placeholder="Ví dụ: Thiếu thông tin bệnh nhân, chẩn đoán chưa rõ ràng..." />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
