import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Alert, Button, Descriptions, Empty, Skeleton, Table, Tabs, Tag } from 'antd'
import { ArrowLeft, ClipboardList, FlaskConical, Pill } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { patientApi } from '../../api/patient.api'
import PageShell from '../../components/PageShell'
import StatusBadge from '../../components/StatusBadge'
import { normalizeRecordStatus, type ExtractedData, type LabResult } from '../../types/medicalRecord.types'
import type { PrescriptionItem } from '../../types/prescription.types'

const ocrLabels: Record<string, string> = {
  facility: 'Cơ sở y tế',
  department: 'Khoa/Phòng',
  recordType: 'Loại bệnh án',
  signerName: 'Người ký',
  diagnosis: 'Chẩn đoán',
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('vi-VN') : '-'
}

function getApiMessage(error: unknown, fallback: string) {
  const apiError = error as { response?: { data?: { message?: string } } }
  return apiError.response?.data?.message ?? fallback
}

function isPrescriptionPending(message: string) {
  return message.toLowerCase().includes('chưa được phát hành') || message.toLowerCase().includes('chua duoc phat hanh')
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

function KeyValueRows({
  emptyText,
  rows,
}: {
  emptyText: string
  rows: Array<{ fieldName: string; label: string; fieldValue: string }>
}) {
  if (!rows.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-12">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyText} />
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {rows.map((row) => (
        <div
          key={row.fieldName}
          className="grid gap-2 border-b border-slate-100 p-4 last:border-b-0 md:grid-cols-[240px_minmax(0,1fr)] md:gap-6"
        >
          <div className="min-w-0">
            <p className="font-medium text-slate-950">{row.label}</p>
            <p className="mt-1 font-mono text-xs text-slate-400">{row.fieldName}</p>
          </div>
          <p className="min-w-0 whitespace-pre-wrap break-words text-slate-700">{row.fieldValue || '-'}</p>
        </div>
      ))}
    </div>
  )
}

export default function PatientSelfRecordDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const recordQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['patient-me-record', id],
    queryFn: () => patientApi.getMyRecordDetail(String(id)).then((response) => response.data.data),
    retry: false,
  })

  const prescriptionQuery = useQuery({
    enabled: Boolean(id && recordQuery.data),
    queryKey: ['patient-me-record-prescription', id],
    queryFn: () => patientApi.getMyRecordPrescription(String(id)).then((response) => response.data.data),
    retry: false,
  })

  const record = recordQuery.data
  const prescription = prescriptionQuery.data
  const prescriptionErrorMessage = prescriptionQuery.isError
    ? getApiMessage(prescriptionQuery.error, 'Không tìm thấy toa thuốc')
    : null
  const ocrRows = useMemo(() => normalizeExtractedData(record?.extractedData ?? null), [record?.extractedData])

  if (recordQuery.isPending) {
    return <Skeleton active paragraph={{ rows: 8 }} />
  }

  if (recordQuery.isError || !record) {
    return (
      <PageShell
        title="Chi tiết bệnh án"
        actions={
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/my-medical-records')}>
            Quay lại
          </Button>
        }
      >
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
          <Alert type="error" showIcon message={getApiMessage(recordQuery.error, 'Không tìm thấy bệnh án')} />
        </section>
      </PageShell>
    )
  }

  return (
    <PageShell
      title={record.recordNumber}
      description="Chi tiết bệnh án của tài khoản bệnh nhân hiện tại."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={normalizeRecordStatus(record.status)} />
          <Button icon={<ArrowLeft size={16} />} onClick={() => navigate('/my-medical-records')}>
            Quay lại
          </Button>
        </div>
      }
    >
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Thông tin bệnh án</p>
            <h2 className="mt-1 text-2xl font-semibold text-slate-950">{record.recordType ?? record.department ?? 'Bệnh án'}</h2>
          </div>
          {record.recordType ? <Tag color="blue">{record.recordType}</Tag> : null}
        </div>

        <Descriptions className="mt-5" bordered column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label="Mã bệnh án">{record.recordNumber}</Descriptions.Item>
          <Descriptions.Item label="Trạng thái">
            <StatusBadge status={normalizeRecordStatus(record.status)} />
          </Descriptions.Item>
          <Descriptions.Item label="Khoa/Phòng">{record.department ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Loại bệnh án">{record.recordType ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Tên file">{record.fileName ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Loại file">{record.fileType ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Ngày tạo">{formatDateTime(record.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Cập nhật">{formatDateTime(record.updatedAt)}</Descriptions.Item>
        </Descriptions>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Bệnh nhân</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-950">{record.patient.name}</h2>

        <Descriptions className="mt-5" bordered column={{ xs: 1, md: 2 }}>
          <Descriptions.Item label="BHYT">{record.patient.bhyt ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="CCCD">{record.patient.citizenId ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Giới tính">{record.patient.gender ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Ngày sinh">{record.patient.dob ? new Date(record.patient.dob).toLocaleDateString('vi-VN') : '-'}</Descriptions.Item>
          <Descriptions.Item label="Số điện thoại">{record.patient.phone ?? '-'}</Descriptions.Item>
          <Descriptions.Item label="Địa chỉ" span={2}>
            {record.patient.address ?? '-'}
          </Descriptions.Item>
        </Descriptions>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
        <Tabs
          className="p-5"
          items={[
            {
              key: 'ocr',
              label: (
                <span className="inline-flex items-center gap-2">
                  <ClipboardList size={16} />
                  Dữ liệu OCR
                </span>
              ),
              children: <KeyValueRows rows={ocrRows} emptyText="Không có dữ liệu OCR." />,
            },
            {
              key: 'lab',
              label: (
                <span className="inline-flex items-center gap-2">
                  <FlaskConical size={16} />
                  Xét nghiệm
                </span>
              ),
              children: (
                <Table<LabResult>
                  rowKey={(item, index) => `${item.testName}-${item.testValue}-${index}`}
                  tableLayout="fixed"
                  pagination={false}
                  scroll={{ x: 760 }}
                  dataSource={record.labData}
                  locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có dữ liệu xét nghiệm." /> }}
                  columns={[
                    { title: 'Xét nghiệm', dataIndex: 'testName', width: 230 },
                    { title: 'Giá trị', dataIndex: 'testValue', width: 120 },
                    { title: 'Đơn vị', dataIndex: 'unit', width: 120 },
                    { title: 'Khoảng tham chiếu', dataIndex: 'referenceRange', width: 190 },
                    {
                      title: 'Bất thường',
                      dataIndex: 'isAbnormal',
                      width: 120,
                      render: (value: boolean) => (value ? <Tag color="red">Có</Tag> : <Tag color="green">Không</Tag>),
                    },
                  ]}
                />
              ),
            },
            {
              key: 'prescription',
              label: (
                <span className="inline-flex items-center gap-2">
                  <Pill size={16} />
                  Toa thuốc
                </span>
              ),
              children: prescriptionQuery.isPending ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : prescription ? (
                <div className="space-y-5">
                  <Descriptions bordered column={{ xs: 1, md: 2 }}>
                    <Descriptions.Item label="Mã toa thuốc">{prescription.prescriptionNumber}</Descriptions.Item>
                    <Descriptions.Item label="Ngày phát hành">{formatDateTime(prescription.issuedAt)}</Descriptions.Item>
                    <Descriptions.Item label="Bệnh viện">{prescription.hospitalName ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Bác sĩ">{prescription.doctorName ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Người nhận">{prescription.receiverName ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="BHYT">{prescription.insuranceCode ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Thời gian dùng">{prescription.durationDays ? `${prescription.durationDays} ngày` : '-'}</Descriptions.Item>
                    <Descriptions.Item label="Địa chỉ">{prescription.receiverAddress ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label="Chẩn đoán" span={2}>
                      {prescription.diagnosis ?? '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Lời dặn" span={2}>
                      {prescription.advice ?? '-'}
                    </Descriptions.Item>
                  </Descriptions>

                  <Table<PrescriptionItem>
                    rowKey={(item, index) => `${item.medicineName}-${item.quantity}-${index}`}
                    tableLayout="fixed"
                    pagination={false}
                    scroll={{ x: 940 }}
                    dataSource={prescription.items}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Toa thuốc chưa có thuốc." /> }}
                    columns={[
                      { title: 'Thuốc', dataIndex: 'medicineName', width: 220 },
                      { title: 'Hàm lượng', dataIndex: 'strength', width: 120, render: (value: string | null) => value ?? '-' },
                      { title: 'Đơn vị', dataIndex: 'unit', width: 100, render: (value: string | null) => value ?? '-' },
                      { title: 'Số lượng', dataIndex: 'quantity', width: 100 },
                      { title: 'Sáng', dataIndex: 'morningDose', width: 110, render: (value: string | null) => value ?? '-' },
                      { title: 'Trưa', dataIndex: 'noonDose', width: 110, render: (value: string | null) => value ?? '-' },
                      { title: 'Chiều', dataIndex: 'afternoonDose', width: 110, render: (value: string | null) => value ?? '-' },
                      { title: 'Tối', dataIndex: 'eveningDose', width: 110, render: (value: string | null) => value ?? '-' },
                      { title: 'Hướng dẫn', dataIndex: 'instruction', width: 220, render: (value: string | null) => value ?? '-' },
                    ]}
                  />
                </div>
              ) : (
                <Alert
                  type={prescriptionErrorMessage && isPrescriptionPending(prescriptionErrorMessage) ? 'info' : 'warning'}
                  showIcon
                  message={prescriptionErrorMessage ?? 'Chưa có toa thuốc'}
                  description={
                    prescriptionErrorMessage && isPrescriptionPending(prescriptionErrorMessage)
                      ? 'Toa thuốc đang được bác sĩ soạn, vui lòng quay lại sau.'
                      : 'Bệnh án này hiện chưa có toa thuốc được phát hành.'
                  }
                />
              ),
            },
          ]}
        />
      </section>
    </PageShell>
  )
}
