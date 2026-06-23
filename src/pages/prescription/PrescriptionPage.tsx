import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  App,
  AutoComplete,
  Button,
  Descriptions,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Tag,
} from 'antd'
import { BadgeCheck, FilePenLine, Pill, Plus, Printer, Save, Trash2 } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import StatusBadge from '../../components/StatusBadge'
import { medicalRecordApi } from '../../api/medicalRecord.api'
import { medicineApi, prescriptionApi } from '../../api/prescription.api'
import { usePermission } from '../../hooks/usePermission'
import { normalizeRecordStatus } from '../../types/medicalRecord.types'
import type {
  Medicine,
  Prescription,
  PrescriptionDurationOption,
  PrescriptionItem,
  PrescriptionPrintData,
  UpdatePrescriptionPayload,
} from '../../types/prescription.types'

type PrescriptionFormValues = {
  hospitalName?: string | null
  receiverName?: string | null
  insuranceCode?: string | null
  receiverAddress?: string | null
  diagnosis?: string | null
  durationOption?: PrescriptionDurationOption | null
  durationDays?: number | null
  advice?: string | null
  items?: PrescriptionItem[]
}

const durationOptions: Array<{ value: PrescriptionDurationOption; label: string; days?: number }> = [
  { value: 'ONE_WEEK', label: '1 tuần', days: 7 },
  { value: 'TWO_WEEKS', label: '2 tuần', days: 14 },
  { value: 'THREE_WEEKS', label: '3 tuần', days: 21 },
  { value: 'ONE_MONTH', label: '1 tháng', days: 30 },
  { value: 'CUSTOM', label: 'Tùy chỉnh' },
]

const instructionOptions = [
  { value: 'Trước ăn' },
  { value: 'Sau ăn' },
  { value: 'Uống buổi sáng' },
  { value: 'Uống nhiều nước' },
]

function nullableText(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

function emptyItem(sortOrder = 0): PrescriptionItem {
  return {
    medicineId: null,
    medicineName: '',
    strength: null,
    unit: null,
    quantity: 1,
    morningDose: null,
    noonDose: null,
    afternoonDose: null,
    eveningDose: null,
    instruction: null,
    sortOrder,
  }
}

function toFormValues(prescription: Prescription): PrescriptionFormValues {
  return {
    hospitalName: prescription.hospitalName,
    receiverName: prescription.receiverName,
    insuranceCode: prescription.insuranceCode,
    receiverAddress: prescription.receiverAddress,
    diagnosis: prescription.diagnosis,
    durationOption: prescription.durationOption,
    durationDays: prescription.durationDays,
    advice: prescription.advice,
    items: prescription.items.length ? prescription.items : [emptyItem()],
  }
}

function buildPayload(values: PrescriptionFormValues): UpdatePrescriptionPayload {
  return {
    hospital_name: nullableText(values.hospitalName),
    receiver_name: nullableText(values.receiverName),
    insurance_code: nullableText(values.insuranceCode),
    receiver_address: nullableText(values.receiverAddress),
    diagnosis: nullableText(values.diagnosis),
    duration_option: values.durationOption ?? null,
    duration_days: values.durationOption === 'CUSTOM' ? values.durationDays ?? null : null,
    advice: nullableText(values.advice),
    items: (values.items ?? []).map((item, index) => ({
      medicine_id: item.medicineId ?? null,
      medicine_name: nullableText(item.medicineName) ?? '',
      strength: nullableText(item.strength),
      unit: nullableText(item.unit),
      quantity: Number(item.quantity || 0),
      morning_dose: nullableText(item.morningDose),
      noon_dose: nullableText(item.noonDose),
      afternoon_dose: nullableText(item.afternoonDose),
      evening_dose: nullableText(item.eveningDose),
      instruction: nullableText(item.instruction),
      sort_order: index,
    })),
  }
}

function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString('vi-VN') : '-'
}

function compactDoses(item: PrescriptionItem) {
  return [
    item.morningDose ? `Sáng ${item.morningDose}` : null,
    item.noonDose ? `Trưa ${item.noonDose}` : null,
    item.afternoonDose ? `Chiều ${item.afternoonDose}` : null,
    item.eveningDose ? `Tối ${item.eveningDose}` : null,
  ].filter(Boolean).join(', ')
}

function PrescriptionPaper({ data, draft }: { data?: PrescriptionPrintData | null; draft?: Prescription | null }) {
  const source = data ?? draft
  const items = source?.items ?? []

  return (
    <div className="prescription-paper mx-auto w-[760px] max-w-full bg-white p-5 text-[#0F172A] shadow-[0_14px_32px_-28px_rgba(15,23,42,0.42)] ring-1 ring-[#E5EAF1] sm:p-7">
      <div className="flex items-start justify-between gap-6 border-b-2 border-[#0F172A] pb-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#64748B]">Cơ sở khám chữa bệnh</p>
          <h2 className="mt-2 text-xl font-extrabold uppercase tracking-wide">
            {source?.hospitalName || 'Bệnh viện / Phòng khám'}
          </h2>
          <p className="mt-1 text-sm text-[#64748B]">Đơn thuốc điện tử từ hệ thống MED-OCR</p>
        </div>
        <div className="text-right">
          <div className="inline-flex rounded-lg border border-[#E5EAF1] bg-[#EFF6FF] px-3 py-2 font-mono text-xs font-semibold text-[#2563EB]">
            {source?.prescriptionNumber ?? 'PRE-DRAFT'}
          </div>
          <p className="mt-2 text-xs text-[#64748B]">Ngày lập: {formatDateTime(data?.issuedAt ?? draft?.issuedAt ?? draft?.createdAt)}</p>
        </div>
      </div>

      <div className="py-6 text-center">
        <h1 className="text-2xl font-black uppercase tracking-[0.16em] sm:text-3xl">Toa thuốc</h1>
      </div>

      <div className="grid gap-x-8 gap-y-2 border-y border-[#E5EAF1] py-4 text-sm md:grid-cols-2">
        <p><span className="font-semibold">Người nhận:</span> {source?.receiverName || '-'}</p>
        <p><span className="font-semibold">Mã BHYT:</span> {source?.insuranceCode || '-'}</p>
        <p className="md:col-span-2"><span className="font-semibold">Địa chỉ:</span> {source?.receiverAddress || '-'}</p>
        <p className="md:col-span-2"><span className="font-semibold">Chẩn đoán:</span> {source?.diagnosis || '-'}</p>
        <p><span className="font-semibold">Bác sĩ:</span> {source?.doctorName || '-'}</p>
        <p><span className="font-semibold">Thời gian dùng:</span> {source?.durationDays ? `${source.durationDays} ngày` : '-'}</p>
      </div>

      <div className="mt-6">
        <h3 className="text-base font-extrabold uppercase">Danh mục thuốc chỉ định</h3>
        <div className="mt-3 overflow-hidden rounded-lg border border-[#E5EAF1]">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#F7F9FC] text-left">
                <th className="w-12 border-b border-r border-[#E5EAF1] p-2 text-center">STT</th>
                <th className="border-b border-r border-[#E5EAF1] p-2">Tên thuốc, hàm lượng</th>
                <th className="w-20 border-b border-r border-[#E5EAF1] p-2 text-center">ĐVT</th>
                <th className="w-20 border-b border-[#E5EAF1] p-2 text-center">SL</th>
              </tr>
            </thead>
            <tbody>
              {items.length ? items.map((item, index) => (
                <tr key={`${item.medicineName}-${index}`}>
                  <td className="border-r border-[#E5EAF1] p-2 text-center align-top">{index + 1}</td>
                  <td className="border-r border-[#E5EAF1] p-2">
                    <p className="font-bold">{item.medicineName || 'Tên thuốc'} {item.strength ? ` ${item.strength}` : ''}</p>
                    <p className="mt-1 italic text-slate-700">{compactDoses(item) || 'Liều dùng chưa nhập'}</p>
                    {item.instruction ? <p className="mt-1 text-[#64748B]">Cách dùng: {item.instruction}</p> : null}
                  </td>
                  <td className="border-r border-[#E5EAF1] p-2 text-center align-top">{item.unit || '-'}</td>
                  <td className="p-2 text-center align-top">{item.quantity || '-'}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-[#64748B]">Chưa có thuốc trong toa</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_220px]">
        <div>
          <p className="font-bold italic">Lời dặn:</p>
          <p className="mt-2 min-h-16 whitespace-pre-line text-sm text-slate-700">{source?.advice || '-'}</p>
        </div>
        <div className="text-center">
          <p className="text-sm italic">Bác sĩ kê toa</p>
          <div className="my-8 text-4xl font-black text-[#C9D6F0]">✓</div>
          <p className="font-bold">{source?.doctorName || '-'}</p>
        </div>
      </div>
    </div>
  )
}

export default function PrescriptionPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const canManagePrescription = usePermission('medical-records-approval:create')
  const [form] = Form.useForm<PrescriptionFormValues>()
  const watchedValues = Form.useWatch([], form) as PrescriptionFormValues | undefined
  const [medicineSearch, setMedicineSearch] = useState('')

  const recordQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['record', id],
    queryFn: () => medicalRecordApi.detail(Number(id)).then((response) => response.data.data),
  })

  const prescriptionQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['prescription', 'medical-record', id],
    queryFn: () => prescriptionApi.getByMedicalRecord(Number(id)).then((response) => response.data.data),
  })

  const medicineQuery = useQuery({
    enabled: medicineSearch.trim().length >= 2,
    queryKey: ['medicine', medicineSearch],
    queryFn: () => medicineApi.list({ q: medicineSearch, page: 1, limit: 12 }).then((response) => response.data.data.items),
  })

  const prescription = prescriptionQuery.data ?? null
  const record = recordQuery.data
  const isApprovedRecord = normalizeRecordStatus(record?.status) === 'APPROVED'
  const isIssued = prescription?.status === 'ISSUED'
  const canEdit = Boolean(canManagePrescription && prescription && !isIssued)

  const printQuery = useQuery({
    enabled: Boolean(prescription?.id && isIssued),
    queryKey: ['prescription', prescription?.id, 'print'],
    queryFn: () => prescriptionApi.print(prescription!.id).then((response) => response.data.data),
  })

  useEffect(() => {
    if (prescription) form.setFieldsValue(toFormValues(prescription))
  }, [form, prescription])

  const createMutation = useMutation({
    mutationFn: () => prescriptionApi.createForMedicalRecord(Number(id)),
    onSuccess: async (response) => {
      message.success(response.data.message || 'Đã tạo toa thuốc nháp')
      await queryClient.invalidateQueries({ queryKey: ['prescription', 'medical-record', id] })
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Tạo toa thuốc thất bại'),
  })

  const updateMutation = useMutation({
    mutationFn: (values: PrescriptionFormValues) => {
      if (!prescription) throw new Error('Chưa có toa thuốc')
      return prescriptionApi.update(prescription.id, buildPayload(values))
    },
    onSuccess: async (response) => {
      message.success(response.data.message || 'Đã lưu nháp toa thuốc')
      await queryClient.invalidateQueries({ queryKey: ['prescription', 'medical-record', id] })
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Lưu toa thuốc thất bại'),
  })

  const issueMutation = useMutation({
    mutationFn: async (values: PrescriptionFormValues) => {
      if (!prescription) throw new Error('Chưa có toa thuốc')
      await prescriptionApi.update(prescription.id, buildPayload(values))
      return prescriptionApi.issue(prescription.id)
    },
    onSuccess: async (response) => {
      message.success(response.data.message || 'Đã phát hành toa thuốc')
      await queryClient.invalidateQueries({ queryKey: ['prescription', 'medical-record', id] })
      await queryClient.invalidateQueries({ queryKey: ['prescription', prescription?.id, 'print'] })
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Phát hành toa thuốc thất bại'),
  })

  const medicineOptions = useMemo(
    () => (medicineQuery.data ?? []).map((medicine) => ({
      value: `${medicine.name}${medicine.strength ? ` ${medicine.strength}` : ''}`,
      label: (
        <div>
          <p className="font-medium text-[#0F172A]">{medicine.name} {medicine.strength}</p>
          <p className="text-xs text-[#64748B]">{medicine.code} · {medicine.dosageForm ?? '-'} · {medicine.unit ?? '-'}</p>
        </div>
      ),
      medicine,
    })),
    [medicineQuery.data],
  )

  const previewDraft = useMemo<Prescription | null>(() => {
    if (!prescription) return null
    const values = watchedValues ?? form.getFieldsValue()
    return {
      ...prescription,
      hospitalName: values.hospitalName ?? prescription.hospitalName,
      receiverName: values.receiverName ?? prescription.receiverName,
      insuranceCode: values.insuranceCode ?? prescription.insuranceCode,
      receiverAddress: values.receiverAddress ?? prescription.receiverAddress,
      diagnosis: values.diagnosis ?? prescription.diagnosis,
      durationOption: values.durationOption ?? prescription.durationOption,
      durationDays: values.durationDays ?? prescription.durationDays,
      advice: values.advice ?? prescription.advice,
      items: values.items ?? prescription.items,
    }
  }, [form, prescription, watchedValues])

  const handleSelectMedicine = (fieldName: number, medicine: Medicine) => {
    const items = form.getFieldValue('items') ?? []
    items[fieldName] = {
      ...items[fieldName],
      medicineId: medicine.id,
      medicineName: medicine.name,
      strength: medicine.strength,
      unit: medicine.unit,
    }
    form.setFieldValue('items', items)
  }

  if (recordQuery.isLoading || prescriptionQuery.isLoading) {
    return <Skeleton active paragraph={{ rows: 10 }} />
  }

  return (
    <PageShell
      title="Kê toa thuốc"
      description="Tạo, lưu nháp, phát hành và in toa thuốc từ bệnh án đã duyệt."
      actions={
        <Space wrap>
          <Button onClick={() => navigate(`/medical-records/${id}`)}>Quay lại bệnh án</Button>
          {prescription ? <Tag color={isIssued ? 'green' : 'gold'}>{prescription.status}</Tag> : null}
        </Space>
      }
    >
      <section className="ui-page-card">
        <div className="ui-hero-mint p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="grid size-14 place-items-center rounded-xl bg-[#EFF6FF] text-[#2563EB] ring-1 ring-[#C9D6F0]">
                <Pill size={25} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#2563EB]">Prescription workspace</p>
                <h2 className="mt-2 text-2xl font-bold text-[#0F172A]">
                  {prescription?.prescriptionNumber ?? 'Chưa có toa thuốc'}
                </h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  Bệnh án {record?.recordNumber ?? `#${id}`} {record ? <StatusBadge status={record.status} /> : null}
                </p>
              </div>
            </div>
            {!prescription ? (
              <Button
                type="primary"
                size="large"
                icon={<Plus size={18} />}
                disabled={!isApprovedRecord || !canManagePrescription}
                loading={createMutation.isPending}
                onClick={() => createMutation.mutate()}
              >
                Tạo toa thuốc
              </Button>
            ) : null}
          </div>
        </div>

        {!prescription ? (
          <div className="p-10">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={isApprovedRecord ? 'Bệnh án đã duyệt và có thể tạo toa thuốc.' : 'Chỉ có thể tạo toa thuốc khi bệnh án ở trạng thái APPROVED.'}
            />
          </div>
        ) : (
          <div className="grid items-start gap-0 xl:grid-cols-[minmax(0,1fr)_minmax(420px,620px)]">
            <div className="border-b border-[#E5EAF1] p-5 xl:border-r xl:border-b-0">
              <Descriptions className="mb-5" bordered size="small" column={1}>
                <Descriptions.Item label="Bệnh nhân">{record?.patient?.name ?? prescription.receiverName ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="BHYT">{record?.patient?.bhyt ?? prescription.insuranceCode ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Địa chỉ">{record?.patient?.address ?? prescription.receiverAddress ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Chẩn đoán">{String(record?.extractedData?.diagnosis ?? prescription.diagnosis ?? '-')}</Descriptions.Item>
              </Descriptions>

              <Form form={form} layout="vertical" disabled={!canEdit} requiredMark={false}>
                <Form.Item name="receiverName" hidden>
                  <Input />
                </Form.Item>
                <Form.Item name="insuranceCode" hidden>
                  <Input />
                </Form.Item>
                <Form.Item name="receiverAddress" hidden>
                  <Input.TextArea />
                </Form.Item>
                <div className="grid gap-4 md:grid-cols-2">
                  <Form.Item name="hospitalName" label="Bệnh viện / phòng khám" rules={[{ required: true, message: 'Nhập tên bệnh viện' }]}>
                    <Input placeholder="Bệnh viện Đa khoa ABC" />
                  </Form.Item>
                  <Form.Item name="durationOption" label="Thời gian dùng" rules={[{ required: true, message: 'Chọn thời gian dùng thuốc' }]}>
                    <Select
                      options={durationOptions}
                      onChange={(value) => {
                        const selected = durationOptions.find((item) => item.value === value)
                        form.setFieldValue('durationDays', selected?.days ?? null)
                      }}
                    />
                  </Form.Item>
                </div>

                <Form.Item noStyle shouldUpdate={(prev, next) => prev.durationOption !== next.durationOption}>
                  {({ getFieldValue }) => (
                    getFieldValue('durationOption') === 'CUSTOM' ? (
                      <Form.Item name="durationDays" label="Số ngày dùng thuốc" rules={[{ required: true, message: 'Nhập số ngày' }]}>
                        <InputNumber min={1} max={365} className="w-full" />
                      </Form.Item>
                    ) : null
                  )}
                </Form.Item>

                <Form.Item name="diagnosis" label="Chẩn đoán" rules={[{ required: true, message: 'Nhập chẩn đoán' }]}>
                  <Input.TextArea rows={2} placeholder="Chẩn đoán dùng để in toa" />
                </Form.Item>

                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">Danh sách thuốc</p>
                    <p className="text-xs text-[#64748B]">Tìm thuốc trong danh mục hoặc nhập tay nếu chưa có.</p>
                  </div>
                </div>

                <Form.List name="items" rules={[{ validator: async (_, value) => value?.length ? undefined : Promise.reject(new Error('Thêm ít nhất một thuốc')) }]}>
                  {(fields, { add, remove }) => (
                    <div className="space-y-3">
                      <div className="max-h-[58vh] overflow-y-auto pr-2">
                        <div className="space-y-3">
                          {fields.map((field, index) => (
                            <div key={field.key} className="rounded-xl border border-[#E5EAF1] bg-[#F7F9FC] p-4">
                              <div className="mb-3 flex items-center justify-between gap-3">
                                <Tag color="blue">#{index + 1}</Tag>
                                {fields.length > 1 ? <Button danger type="text" icon={<Trash2 size={16} />} onClick={() => remove(field.name)} /> : null}
                              </div>
                              <Form.Item name={[field.name, 'medicineId']} hidden>
                                <Input />
                              </Form.Item>
                              <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
                                <Form.Item name={[field.name, 'medicineName']} label="Tên thuốc" rules={[{ required: true, message: 'Nhập tên thuốc' }]}>
                                  <AutoComplete
                                    options={medicineOptions}
                                    onSearch={setMedicineSearch}
                                    onSelect={(_, option) => handleSelectMedicine(field.name, (option as { medicine: Medicine }).medicine)}
                                    placeholder="Paracetamol"
                                  />
                                </Form.Item>
                                <Form.Item name={[field.name, 'strength']} label="Hàm lượng">
                                  <Input placeholder="500mg" />
                                </Form.Item>
                                <Form.Item name={[field.name, 'unit']} label="Đơn vị">
                                  <Input placeholder="viên" />
                                </Form.Item>
                              </div>
                              <div className="grid grid-cols-[repeat(auto-fit,minmax(118px,1fr))] gap-3">
                                <Form.Item name={[field.name, 'quantity']} label="Số lượng" rules={[{ required: true, message: 'Nhập SL' }]}>
                                  <InputNumber min={1} className="w-full" />
                                </Form.Item>
                                <Form.Item name={[field.name, 'morningDose']} label="Sáng"><Input placeholder="1 viên" /></Form.Item>
                                <Form.Item name={[field.name, 'noonDose']} label="Trưa"><Input placeholder="1 viên" /></Form.Item>
                                <Form.Item name={[field.name, 'afternoonDose']} label="Chiều"><Input placeholder="1 viên" /></Form.Item>
                                <Form.Item name={[field.name, 'eveningDose']} label="Tối"><Input placeholder="1 viên" /></Form.Item>
                              </div>
                              <Form.Item name={[field.name, 'instruction']} label="Cách dùng">
                                <AutoComplete options={instructionOptions} placeholder="Chọn hoặc nhập cách dùng" />
                              </Form.Item>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Button icon={<Plus size={16} />} onClick={() => add(emptyItem(fields.length))}>Thêm thuốc</Button>
                    </div>
                  )}
                </Form.List>

                <Form.Item name="advice" label="Lời dặn" className="mt-5">
                  <Input.TextArea rows={3} placeholder="Uống nhiều nước, tái khám nếu có dấu hiệu bất thường..." />
                </Form.Item>

              </Form>
            </div>

            <div className="self-start border-t border-[#E5EAF1] bg-[#F7F9FC] p-5 xl:border-t-0 xl:border-l">
              <div className="rounded-xl border border-[#E5EAF1] bg-white p-4 shadow-[0_10px_28px_-26px_rgba(15,23,42,0.5)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-xl bg-[#EFF6FF] text-[#2563EB] ring-1 ring-[#C9D6F0]">
                      <FilePenLine size={19} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0F172A]">Mẫu in toa</p>
                      <p className="text-xs text-[#64748B]">Xem trước nội dung trước khi phát hành.</p>
                    </div>
                  </div>
                  {isIssued ? <Tag color="green">Bản phát hành</Tag> : <Tag color="gold">Bản nháp</Tag>}
                </div>
                {printQuery.isLoading && isIssued ? (
                  <Skeleton active paragraph={{ rows: 10 }} />
                ) : (
                  <div className="rounded-xl">
                    <PrescriptionPaper data={printQuery.data} draft={previewDraft} />
                  </div>
                )}
                <div className="mt-4 border-t border-[#E5EAF1] pt-4">
                  <Space wrap>
                    <Button icon={<Save size={17} />} loading={updateMutation.isPending} disabled={!canEdit} onClick={async () => updateMutation.mutate(await form.validateFields())}>
                      Lưu nháp
                    </Button>
                    <Popconfirm title="Phát hành toa thuốc?" description="Sau khi phát hành, toa thuốc không thể chỉnh sửa." onConfirm={async () => issueMutation.mutate(await form.validateFields())}>
                      <Button type="primary" icon={<BadgeCheck size={17} />} loading={issueMutation.isPending} disabled={!canEdit}>
                        Phát hành
                      </Button>
                    </Popconfirm>
                    <Button icon={<Printer size={17} />} disabled={!isIssued} onClick={() => window.print()}>
                      In toa
                    </Button>
                  </Space>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </PageShell>
  )
}
