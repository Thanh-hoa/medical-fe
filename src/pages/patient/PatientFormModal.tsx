import { useEffect } from 'react'
import { DatePicker, Form, Input, Modal, Select } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import type { Patient, UpsertPatientPayload } from '../../types/patient.types'

interface PatientFormValues {
  bhyt: string
  name: string
  dob?: Dayjs | null
  gender?: string | null
  address?: string | null
  phone?: string | null
}

interface PatientFormModalProps {
  open: boolean
  mode: 'create' | 'edit'
  patient?: Patient | null
  loading?: boolean
  onCancel: () => void
  onSubmit: (payload: UpsertPatientPayload) => void
}

function nullableText(value?: string | null) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export default function PatientFormModal({
  open,
  mode,
  patient,
  loading,
  onCancel,
  onSubmit,
}: PatientFormModalProps) {
  const [form] = Form.useForm<PatientFormValues>()

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }

    form.setFieldsValue({
      bhyt: patient?.bhyt ?? '',
      name: patient?.name ?? '',
      dob: patient?.dob ? dayjs(patient.dob) : null,
      gender: patient?.gender ?? null,
      address: patient?.address ?? null,
      phone: patient?.phone ?? null,
    })
  }, [form, open, patient])

  const handleOk = async () => {
    const values = await form.validateFields()

    onSubmit({
      bhyt: values.bhyt.trim(),
      name: values.name.trim(),
      dob: values.dob ? values.dob.format('YYYY-MM-DD') : null,
      gender: nullableText(values.gender),
      address: nullableText(values.address),
      phone: nullableText(values.phone),
    })
  }

  return (
    <Modal
      open={open}
      title={mode === 'create' ? 'Tạo hồ sơ bệnh nhân' : 'Cập nhật bệnh nhân'}
      okText={mode === 'create' ? 'Tạo hồ sơ' : 'Lưu thay đổi'}
      cancelText="Hủy"
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={handleOk}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" className="pt-3">
        <Form.Item
          label="Số thẻ BHYT"
          name="bhyt"
          rules={[
            { required: true, message: 'Vui lòng nhập số thẻ BHYT' },
            { whitespace: true, message: 'Số thẻ BHYT không được để trống' },
          ]}
        >
          <Input placeholder="VD: GD4030000123456" />
        </Form.Item>

        <Form.Item
          label="Họ tên"
          name="name"
          rules={[
            { required: true, message: 'Vui lòng nhập họ tên bệnh nhân' },
            { whitespace: true, message: 'Họ tên không được để trống' },
          ]}
        >
          <Input placeholder="Nguyễn Văn A" />
        </Form.Item>

        <div className="grid gap-3 md:grid-cols-2">
          <Form.Item label="Ngày sinh" name="dob">
            <DatePicker className="w-full" format="DD/MM/YYYY" placeholder="Chọn ngày sinh" />
          </Form.Item>
          <Form.Item label="Giới tính" name="gender">
            <Select
              allowClear
              placeholder="Chọn giới tính"
              options={[
                { value: 'Nam', label: 'Nam' },
                { value: 'Nữ', label: 'Nữ' },
                { value: 'Khác', label: 'Khác' },
              ]}
            />
          </Form.Item>
        </div>

        <Form.Item label="Số điện thoại" name="phone">
          <Input placeholder="0901234567" />
        </Form.Item>

        <Form.Item label="Địa chỉ" name="address">
          <Input.TextArea rows={3} placeholder="Địa chỉ liên hệ" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
