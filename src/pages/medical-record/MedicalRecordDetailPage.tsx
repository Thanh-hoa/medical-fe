import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  App,
  Alert,
  Button,
  DatePicker,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Skeleton,
  Select,
  Table,
  Tabs,
  Timeline,
} from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { CheckCircle2, ClipboardCheck, PencilLine, Pill, RotateCcw, Send, Trash2, XCircle } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import StatusBadge from '../../components/StatusBadge'
import { APP_BASE_URL } from '../../config/env'
import { usePermission } from '../../hooks/usePermission'
import { medicalRecordApi } from '../../api/medicalRecord.api'
import { prescriptionApi } from '../../api/prescription.api'
import type { AuditLogFilters, AuditLogPeriod } from '../../types/auditLog.types'
import {
  normalizeRecordStatus,
  type ExtractedData,
  type LabResult,
  type MedicalRecordDetail,
  type UpdateMedicalRecordDetailPayload,
} from '../../types/medicalRecord.types'

type EditFormValues = {
  department?: string
  recordType?: string
  notes?: string
  patient?: {
    bhyt?: string
    citizenId?: string
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

const hiddenOcrFields = new Set([
  'template_id',
  'sample_collector',
  'sample_receiver',
  'sample_status',
])

const { RangePicker } = DatePicker
const API_DATE_FORMAT = 'YYYY-MM-DD'

type AuditTimeFilterMode = 'all' | 'today' | AuditLogPeriod | 'range'

const auditTimeFilterOptions: { value: AuditTimeFilterMode; label: string }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: 'today', label: 'Hôm nay' },
  { value: 'day', label: 'Theo ngày' },
  { value: 'week', label: 'Theo tuần' },
  { value: 'month', label: 'Theo tháng' },
  { value: 'year', label: 'Theo năm' },
  { value: 'range', label: 'Khoảng ngày' },
]

function buildAuditTimeFilters(
  mode: AuditTimeFilterMode,
  anchorDate: Dayjs,
  range: [Dayjs | null, Dayjs | null] | null,
): AuditLogFilters {
  if (mode === 'all') return {}
  if (mode === 'today') return { period: 'day', date: dayjs().format(API_DATE_FORMAT) }
  if (mode === 'range') {
    return {
      fromDate: range?.[0]?.format(API_DATE_FORMAT),
      toDate: range?.[1]?.format(API_DATE_FORMAT),
    }
  }

  return { period: mode, date: anchorDate.format(API_DATE_FORMAT) }
}

function normalizeExtractedData(data: ExtractedData | null) {
  if (!data) return []

  const rows = Object.entries(data)
    .filter(([key]) => key !== 'extra')
    .filter(([key]) => !hiddenOcrFields.has(key))
    .map(([fieldName, fieldValue]) => ({
      fieldName,
      label: ocrLabels[fieldName] ?? fieldName,
      fieldValue: typeof fieldValue === 'string' ? fieldValue : '',
    }))

  const extraRows = Object.entries(data.extra ?? {})
    .filter(([fieldName]) => !hiddenOcrFields.has(fieldName))
    .map(([fieldName, fieldValue]) => ({
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
      bhyt: record.patient?.bhyt ?? undefined,
      citizenId: record.patient?.citizenId ?? undefined,
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
  const patientValues = values.patient
  const patientName = patientValues?.name?.trim()
  const patient = patientName
    ? {
        name: patientName,
        bhyt: patientValues?.bhyt?.trim() || null,
        citizenId: patientValues?.citizenId?.trim() || null,
        dob: patientValues?.dob || null,
        gender: patientValues?.gender || null,
        address: patientValues?.address || null,
        phone: patientValues?.phone || null,
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

function hasPatientIdentifier(record?: MedicalRecordDetail | null) {
  return Boolean(record?.patient && (record.patient.bhyt?.trim() || record.patient.citizenId?.trim()))
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
  const [editingLabIndex, setEditingLabIndex] = useState<number | null>(null)
  const [labDraft, setLabDraft] = useState<LabResult | null>(null)
  const [diagnosisDraft, setDiagnosisDraft] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm] = Form.useForm<EditFormValues>()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectForm] = Form.useForm<{ rejectionReason: string }>()
  const [auditTimeMode, setAuditTimeMode] = useState<AuditTimeFilterMode>('all')
  const [auditAnchorDate, setAuditAnchorDate] = useState<Dayjs>(dayjs())
  const [auditRangeDates, setAuditRangeDates] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  const auditLogFilters = useMemo<AuditLogFilters>(
    () => ({
      page: 1,
      limit: 20,
      ...buildAuditTimeFilters(auditTimeMode, auditAnchorDate, auditRangeDates),
    }),
    [auditAnchorDate, auditRangeDates, auditTimeMode],
  )

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
    queryKey: ['record', id, 'audit-logs', auditLogFilters],
    queryFn: () => medicalRecordApi.auditLogs(Number(id), auditLogFilters).then((response) => response.data.data),
  })

  const record = recordQuery.data

  const openPatientIdentifierEditor = () => {
    if (!record) return
    editForm.setFieldsValue(buildInitialValues(record))
    setEditOpen(true)
    window.setTimeout(() => editForm.scrollToField(['patient', 'bhyt']), 0)
  }

  const ensurePatientIdentifier = () => {
    if (hasPatientIdentifier(record)) return true

    message.warning('Vui lòng nhập số BHYT hoặc CCCD trước khi gửi bệnh án cho bác sĩ duyệt')
    openPatientIdentifierEditor()
    return false
  }

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
    onError: (error: any) => {
      const apiMessage = error?.response?.data?.message
      message.error(apiMessage ?? 'Gửi duyệt thất bại')
      if (apiMessage === 'record.submit.patient_identifier_required' || apiMessage?.includes('BHYT hoặc CCCD')) {
        openPatientIdentifierEditor()
      }
    },
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
    onError: (error: any) => {
      const apiMessage = error?.response?.data?.message
      message.error(apiMessage ?? 'Nộp lại thất bại')
      if (apiMessage === 'record.submit.patient_identifier_required' || apiMessage?.includes('BHYT hoặc CCCD')) {
        openPatientIdentifierEditor()
      }
    },
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

  const updateLabMutation = useMutation({
    mutationFn: (payload: { index: number; lab: LabResult }) => {
      if (!record) throw new Error('Không có dữ liệu bệnh án')

      const nextLabData = [...(record.labData ?? [])]
      nextLabData[payload.index] = payload.lab

      return medicalRecordApi.updateDetail({
        id: record.id,
        labData: nextLabData,
      })
    },
    onSuccess: async () => {
      message.success('Đã cập nhật xét nghiệm')
      setEditingLabIndex(null)
      setLabDraft(null)
      await invalidate()
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Cập nhật xét nghiệm thất bại'),
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
  const canOpenPrescription = Boolean(record && recordStatus === 'APPROVED')

  const prescriptionQuery = useQuery({
    enabled: Boolean(id && canOpenPrescription),
    queryKey: ['prescription', 'medical-record', id],
    queryFn: () => prescriptionApi.getByMedicalRecord(Number(id)).then((response) => response.data.data),
  })

  const prescriptionActionLabel = (() => {
    if (prescriptionQuery.isLoading) return 'Đang tải toa'
    if (!prescriptionQuery.data) return 'Tạo toa thuốc'
    return prescriptionQuery.data.status === 'ISSUED' ? 'Xem/In toa' : 'Tiếp tục kê toa'
  })()

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
          <div className="flex max-w-full items-center gap-3 overflow-x-auto whitespace-nowrap pb-1">
            <StatusBadge status={record.status} />
            {canOpenEdit ? (
              <Button
                className="shrink-0"
                icon={<PencilLine size={17} />}
                onClick={() => {
                  editForm.setFieldsValue(buildInitialValues(record))
                  setEditOpen(true)
                }}
              >
                Sửa chi tiết
              </Button>
            ) : null}
            {canOpenPrescription ? (
              <Button
                className="shrink-0"
                type={prescriptionQuery.data ? 'default' : 'primary'}
                icon={<Pill size={17} />}
                loading={prescriptionQuery.isLoading}
                onClick={() => navigate(`/medical-records/${id}/prescription`)}
              >
                {prescriptionActionLabel}
              </Button>
            ) : null}
            {canSubmit ? (
              <Button
                className="shrink-0"
                type="primary"
                icon={<Send size={17} />}
                loading={submitMutation.isPending}
                onClick={() => {
                  if (ensurePatientIdentifier()) submitMutation.mutate()
                }}
              >
                Gửi duyệt
              </Button>
            ) : null}
            {canResubmit ? (
              <Popconfirm
                title="Nộp lại bệnh án?"
                description="Hồ sơ sẽ quay lại trạng thái chờ bác sĩ duyệt."
                onConfirm={() => {
                  if (ensurePatientIdentifier()) resubmitMutation.mutate()
                }}
              >
                <Button className="shrink-0" type="primary" icon={<RotateCcw size={17} />} loading={resubmitMutation.isPending}>
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
                  className="shrink-0"
                  type="primary"
                  icon={<CheckCircle2 size={17} />}
                  loading={approveMutation.isPending || approveWithDiagnosisMutation.isPending}
                >
                  Lưu & duyệt
                </Button>
              </Popconfirm>
            ) : null}
            {canReject ? (
              <Button className="shrink-0" danger icon={<XCircle size={17} />} onClick={() => setRejectOpen(true)}>
                Từ chối
              </Button>
            ) : null}
            {canDelete ? (
              <Popconfirm title="Xóa vĩnh viễn bệnh án này?" onConfirm={() => deleteMutation.mutate()}>
                <Button className="shrink-0" danger icon={<Trash2 size={17} />} loading={deleteMutation.isPending}>
                  Xóa
                </Button>
              </Popconfirm>
            ) : null}
          </div>
        }
      >
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)]">
            <div className="min-w-0 border-b border-slate-100 p-5 lg:border-r lg:border-b-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tài liệu gốc</p>
                  <h2 className="mt-1 text-lg font-semibold text-slate-950">{record.fileName}</h2>
                </div>
                <ClipboardCheck className="text-[#2563EB]" size={24} />
              </div>
              <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
                {imageUrl && !record.fileType.includes('pdf') ? (
                  <img src={imageUrl} alt={record.fileName} className="max-h-[78vh] w-full object-contain" />
                ) : imageUrl ? (
                  <iframe src={imageUrl} title={record.fileName} className="h-[78vh] w-full border-0" />
                ) : (
                  <div className="grid min-h-96 place-items-center text-sm text-slate-400">
                    Backend chưa trả đường dẫn file gốc.
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0 p-5">
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
              {(recordStatus === 'EXTRACTED' || recordStatus === 'REJECTED') && !hasPatientIdentifier(record) ? (
                <Alert
                  className="mb-5"
                  type="warning"
                  showIcon
                  message="Chưa có BHYT hoặc CCCD"
                  description="Bệnh án vẫn có thể lưu/chỉnh sửa, nhưng cần bổ sung BHYT hoặc CCCD trước khi gửi bác sĩ duyệt."
                  action={
                    canOpenEdit ? (
                      <Button size="small" onClick={openPatientIdentifierEditor}>
                        Bổ sung
                      </Button>
                    ) : undefined
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
                        <Descriptions.Item label="CCCD">{record.patient?.citizenId ?? '-'}</Descriptions.Item>
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
                        tableLayout="fixed"
                        pagination={false}
                        scroll={{ x: 860 }}
                        dataSource={record.labData}
                        columns={[
                          {
                            title: 'Xét nghiệm',
                            dataIndex: 'testName',
                            width: 260,
                            render: (value, _item, index) =>
                              editingLabIndex === index && labDraft ? (
                                <Input
                                  className="w-full"
                                  value={labDraft.testName}
                                  onChange={(event) => setLabDraft({ ...labDraft, testName: event.target.value })}
                                />
                              ) : (
                                value
                              ),
                          },
                          {
                            title: 'Giá trị',
                            dataIndex: 'testValue',
                            width: 120,
                            render: (value, _item, index) =>
                              editingLabIndex === index && labDraft ? (
                                <Input
                                  className="w-full"
                                  value={labDraft.testValue}
                                  onChange={(event) => setLabDraft({ ...labDraft, testValue: event.target.value })}
                                />
                              ) : (
                                value
                              ),
                          },
                          {
                            title: 'Đơn vị',
                            dataIndex: 'unit',
                            width: 120,
                            render: (value, _item, index) =>
                              editingLabIndex === index && labDraft ? (
                                <Input
                                  className="w-full"
                                  value={labDraft.unit}
                                  onChange={(event) => setLabDraft({ ...labDraft, unit: event.target.value })}
                                />
                              ) : (
                                value
                              ),
                          },
                          {
                            title: 'Khoảng tham chiếu',
                            dataIndex: 'referenceRange',
                            width: 190,
                            render: (value, _item, index) =>
                              editingLabIndex === index && labDraft ? (
                                <Input
                                  className="w-full"
                                  value={labDraft.referenceRange}
                                  onChange={(event) => setLabDraft({ ...labDraft, referenceRange: event.target.value })}
                                />
                              ) : (
                                value
                              ),
                          },
                          {
                            title: 'Thao tác',
                            width: 170,
                            render: (_, item, index) =>
                              canOpenEdit ? (
                                editingLabIndex === index ? (
                                  <div className="flex items-center gap-2 whitespace-nowrap">
                                    <Button
                                      type="link"
                                      loading={updateLabMutation.isPending}
                                      disabled={!labDraft}
                                      onClick={() => {
                                        if (!labDraft) return
                                        updateLabMutation.mutate({ index, lab: labDraft })
                                      }}
                                    >
                                      Lưu
                                    </Button>
                                    <Button
                                      type="link"
                                      onClick={() => {
                                        setEditingLabIndex(null)
                                        setLabDraft(null)
                                      }}
                                    >
                                      Hủy
                                    </Button>
                                  </div>
                                ) : (
                                  <Button
                                    type="link"
                                    disabled={editingLabIndex !== null}
                                    onClick={() => {
                                      setEditingLabIndex(index)
                                      setLabDraft({ ...item })
                                    }}
                                  >
                                    Sửa nhanh
                                  </Button>
                                )
                              ) : null,
                          },
                        ]}
                      />
                    ),
                  },
                  {
                    key: 'audit',
                    label: 'Nhật ký thao tác',
                    children: (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <Select<AuditTimeFilterMode>
                            className="min-w-36"
                            options={auditTimeFilterOptions}
                            value={auditTimeMode}
                            onChange={(mode) => setAuditTimeMode(mode)}
                          />
                          {auditTimeMode !== 'all' && auditTimeMode !== 'today' && auditTimeMode !== 'range' ? (
                            <DatePicker
                              className="w-40"
                              picker={auditTimeMode === 'month' || auditTimeMode === 'year' ? auditTimeMode : 'date'}
                              value={auditAnchorDate}
                              format={auditTimeMode === 'year' ? 'YYYY' : auditTimeMode === 'month' ? 'MM/YYYY' : 'DD/MM/YYYY'}
                              onChange={(value) => setAuditAnchorDate(value ?? dayjs())}
                            />
                          ) : null}
                          {auditTimeMode === 'range' ? (
                            <RangePicker
                              className="w-72"
                              value={auditRangeDates}
                              format="DD/MM/YYYY"
                              onChange={(values) => setAuditRangeDates(values ? [values[0], values[1]] as [Dayjs | null, Dayjs | null] : null)}
                            />
                          ) : null}
                        </div>
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
                      </div>
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
            <Form.Item name={['patient', 'bhyt']} label="Mã BHYT">
              <Input />
            </Form.Item>
            <Form.Item name={['patient', 'citizenId']} label="CCCD">
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
