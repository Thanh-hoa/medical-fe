import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  App,
  Button,
  Descriptions,
  Form,
  Input,
  Modal,
  Popconfirm,
  Skeleton,
  Table,
  Tabs,
} from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import StatusBadge from '../../components/StatusBadge'
import { APP_BASE_URL } from '../../config/env'
import { usePermission, useRole } from '../../hooks/usePermission'
import { medicalRecordApi } from '../../api/medicalRecord.api'

export default function MedicalRecordDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const role = useRole()
  const canDelete = usePermission('medical-records:delete')
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const [rejectOpen, setRejectOpen] = useState(false)
  const [editingField, setEditingField] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [rejectForm] = Form.useForm<{ rejectionReason: string }>()

  const recordQuery = useQuery({
    enabled: Boolean(id),
    queryKey: ['record', id],
    queryFn: () => medicalRecordApi.detail(Number(id)).then((response) => response.data.data),
  })

  const record = recordQuery.data

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: ['record', id] })
    await queryClient.invalidateQueries({ queryKey: ['medical-records'] })
  }

  const submitMutation = useMutation({
    mutationFn: () => medicalRecordApi.submit(Number(id)),
    onSuccess: async () => {
      message.success('Đã submit bệnh án để duyệt')
      await invalidate()
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Submit thất bại'),
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
    mutationFn: (rejectionReason: string) => medicalRecordApi.reject({ id: Number(id), rejectionReason }),
    onSuccess: async () => {
      message.success('Đã từ chối bệnh án')
      setRejectOpen(false)
      rejectForm.resetFields()
      await invalidate()
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Từ chối thất bại'),
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
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Cập nhật field thất bại'),
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

  const canSubmit = record?.status === 'Extracted' && role === 'employee'
  const canApprove = record?.status === 'Pending Doctor Review' && (role === 'doctor' || role === 'admin')

  const imageUrl = useMemo(() => {
    if (!record?.originalImagePath) return null
    return record.originalImagePath.startsWith('http')
      ? record.originalImagePath
      : `${APP_BASE_URL}${record.originalImagePath}`
  }, [record?.originalImagePath])

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
        description="So sánh ảnh gốc với dữ liệu OCR, chỉnh sửa field inline và thực hiện submit/approve/reject tùy role."
        actions={
          <>
            <StatusBadge status={record.status} />
            {canSubmit ? (
              <Button type="primary" loading={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
                Submit để duyệt
              </Button>
            ) : null}
            {canApprove ? (
              <>
                <Button type="primary" loading={approveMutation.isPending} onClick={() => approveMutation.mutate()}>
                  Duyệt
                </Button>
                <Button danger onClick={() => setRejectOpen(true)}>
                  Từ chối
                </Button>
              </>
            ) : null}
            {canDelete ? (
              <Popconfirm title="Xóa bệnh án này?" onConfirm={() => deleteMutation.mutate()}>
                <Button danger loading={deleteMutation.isPending}>
                  Xóa bệnh án
                </Button>
              </Popconfirm>
            ) : null}
          </>
        }
      >
        <div className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Ảnh gốc</h2>
            <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50">
              {imageUrl ? (
                <img src={imageUrl} alt={record.fileName} className="max-h-[70vh] w-full object-contain" />
              ) : (
                <div className="grid min-h-96 place-items-center text-sm text-slate-400">Backend chưa trả đường dẫn ảnh gốc.</div>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
            <Tabs
              items={[
                {
                  key: 'patient',
                  label: 'Bệnh nhân',
                  children: (
                    <Descriptions bordered column={1} size="small">
                      <Descriptions.Item label="Tên">{record.patient?.name ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="BHYT">{record.patient?.bhyt ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="Ngày sinh">
                        {record.patient?.dob ? new Date(record.patient.dob).toLocaleDateString('vi-VN') : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label="Giới tính">{record.patient?.gender ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="Địa chỉ">{record.patient?.address ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="Số điện thoại">{record.patient?.phone ?? '-'}</Descriptions.Item>
                    </Descriptions>
                  ),
                },
                {
                  key: 'ocr',
                  label: 'Dữ liệu OCR',
                  children: (
                    <Table
                      rowKey={([fieldName]) => fieldName}
                      pagination={false}
                      dataSource={Object.entries(record.extractedData)}
                      columns={[
                        { title: 'Field', render: ([fieldName]) => <span className="font-mono text-xs">{fieldName}</span> },
                        {
                          title: 'Giá trị',
                          render: ([fieldName, fieldValue]) =>
                            editingField === fieldName ? (
                              <Input
                                value={draftValue}
                                onChange={(event) => setDraftValue(event.target.value)}
                                onPressEnter={() => updateFieldMutation.mutate({ fieldName, fieldValue: draftValue })}
                              />
                            ) : (
                              <span>{fieldValue || '-'}</span>
                            ),
                        },
                        {
                          title: 'Thao tác',
                          width: 180,
                          render: ([fieldName, fieldValue]) =>
                            editingField === fieldName ? (
                              <div className="flex gap-2">
                                <Button
                                  type="link"
                                  loading={updateFieldMutation.isPending}
                                  onClick={() => updateFieldMutation.mutate({ fieldName, fieldValue: draftValue })}
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
                                  setEditingField(fieldName)
                                  setDraftValue(fieldValue)
                                }}
                              >
                                Sửa
                              </Button>
                            ),
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
                      rowKey={(item) => `${item.testName}-${item.testValue}`}
                      pagination={false}
                      dataSource={record.labData}
                      rowClassName={(item) => (item.isAbnormal ? '!bg-red-50' : '')}
                      columns={[
                        { title: 'Xét nghiệm', dataIndex: 'testName' },
                        { title: 'Giá trị', dataIndex: 'testValue' },
                        { title: 'Đơn vị', dataIndex: 'unit' },
                        { title: 'Khoảng bình thường', dataIndex: 'referenceRange' },
                        {
                          title: 'Đánh dấu',
                          render: (_, item) => (item.isAbnormal ? <span className="text-red-600">Bất thường</span> : 'Bình thường'),
                        },
                      ]}
                    />
                  ),
                },
              ]}
            />
          </section>
        </div>

        {record.rejectionReason ? (
          <section className="rounded-[28px] border border-red-200 bg-red-50 p-5 text-sm text-red-700 shadow-sm">
            <p className="font-semibold">Lý do từ chối</p>
            <p className="mt-2 leading-6">{record.rejectionReason}</p>
          </section>
        ) : null}
      </PageShell>

      <Modal
        open={rejectOpen}
        title="Từ chối bệnh án"
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        confirmLoading={rejectMutation.isPending}
        onCancel={() => setRejectOpen(false)}
        onOk={async () => {
          const values = await rejectForm.validateFields()
          rejectMutation.mutate(values.rejectionReason)
        }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="rejectionReason"
            label="Lý do từ chối"
            rules={[{ required: true, message: 'Nhập lý do từ chối' }]}
          >
            <Input.TextArea rows={4} placeholder="Mô tả lý do để nhân viên chỉnh sửa lại hồ sơ" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}
