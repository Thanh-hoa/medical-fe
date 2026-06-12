import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App, Avatar, Button, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table, Upload } from 'antd'
import type { UploadFile } from 'antd'
import { UploadCloud, UserRound } from 'lucide-react'
import dayjs from 'dayjs'
import { accountApi } from '../../api/account.api'
import { commonApi } from '../../api/common.api'
import PageShell from '../../components/PageShell'
import { usePermission } from '../../hooks/usePermission'
import type { AccountInfo, UpsertAccountPayload } from '../../types/account.types'

type AccountFormValues = {
  email: string
  name: string
  phone_number: string
  birthday?: string
  gender?: string
  photo?: string | null
  roles: number[]
  is_active?: boolean
  upload?: UploadFile[]
}

function toApiDate(value?: string | null) {
  if (!value) return null
  const normalized = dayjs(value, ['YYYY-MM-DD', 'DD/MM/YYYY'], true)
  return normalized.isValid() ? normalized.format('DD/MM/YYYY') : value
}

export default function AccountListPage() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const canCreate = usePermission('accounts:create')
  const canEdit = usePermission('accounts:edit')
  const canDelete = usePermission('accounts:delete')
  const [filters, setFilters] = useState({ q: '', page: 1, limit: 10 })
  const [open, setOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountInfo | null>(null)
  const [form] = Form.useForm<AccountFormValues>()

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', filters],
    queryFn: () => accountApi.list(filters).then((response) => response.data.data),
  })

  const { data: roles = [], isLoading: isLoadingRoles } = useQuery({
    enabled: open,
    queryKey: ['common', 'roles'],
    queryFn: () => commonApi.getRoles().then((response) => response.data.data),
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['accounts'] })
  }

  const createMutation = useMutation({
    mutationFn: (payload: UpsertAccountPayload) => accountApi.create(payload),
    onSuccess: async () => {
      message.success('Đã tạo tài khoản')
      setOpen(false)
      form.resetFields()
      await refresh()
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Tạo tài khoản thất bại'),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: UpsertAccountPayload) => accountApi.update(payload),
    onSuccess: async () => {
      message.success('Đã cập nhật tài khoản')
      setOpen(false)
      setEditingAccount(null)
      form.resetFields()
      await refresh()
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Cập nhật tài khoản thất bại'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number | string) => accountApi.delete([id]),
    onSuccess: async () => {
      message.success('Đã xóa tài khoản')
      await refresh()
    },
    onError: (error: any) => message.error(error?.response?.data?.message ?? 'Xóa tài khoản thất bại'),
  })

  const modalTitle = useMemo(() => (editingAccount ? 'Cập nhật tài khoản' : 'Thêm tài khoản'), [editingAccount])

  const openCreate = () => {
    setEditingAccount(null)
    form.resetFields()
    form.setFieldsValue({ roles: [], is_active: true })
    setOpen(true)
  }

  const openEdit = async (account: AccountInfo) => {
    try {
      const response = await accountApi.getById(account.id)
      const detail = response.data.data
      setEditingAccount(detail)
      form.setFieldsValue({
        email: detail.email,
        name: detail.name ?? '',
        phone_number: detail.phoneNumber ?? '',
        birthday: detail.birthday ?? '',
        gender: detail.gender ?? undefined,
        photo: detail.photoUrl ?? null,
        roles: detail.roles?.map((role) => role.id) ?? [],
        is_active: detail.isActive,
        upload: [],
      })
      setOpen(true)
    } catch (error: any) {
      message.error(error?.response?.data?.message ?? 'Không lấy được chi tiết tài khoản')
    }
  }

  const buildPayload = async (values: AccountFormValues): Promise<UpsertAccountPayload> => {
    let photo = values.photo ?? null
    const file = values.upload?.[0]?.originFileObj

    if (file) {
      const uploadResponse = await commonApi.uploadMedia(file)
      photo = uploadResponse.data.data.path
    }

    return {
      id: editingAccount?.id,
      email: values.email,
      name: values.name,
      phone_number: values.phone_number,
      birthday: toApiDate(values.birthday),
      gender: values.gender,
      photo,
      roles: values.roles,
      is_active: values.is_active,
    }
  }

  return (
    <>
      <PageShell
        title="Quản lý tài khoản"
        description="Quản lý danh sách tài khoản, vai trò, trạng thái hoạt động và ảnh đại diện."
        actions={
          canCreate ? (
            <Button type="primary" size="large" onClick={openCreate}>
              Thêm tài khoản
            </Button>
          ) : null
        }
      >
        <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <Space wrap className="mb-5">
            <Input.Search
              allowClear
              placeholder="Tìm theo tên hoặc email"
              className="min-w-72"
              onSearch={(q) => setFilters((prev) => ({ ...prev, q, page: 1 }))}
            />
          </Space>

          <Table<AccountInfo>
            rowKey="id"
            loading={isLoading}
            dataSource={data?.items ?? []}
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total: data?.totalItems ?? 0,
              onChange: (page, pageSize) => setFilters((prev) => ({ ...prev, page, limit: pageSize })),
            }}
            columns={[
              {
                title: 'Tài khoản',
                render: (_, item) => (
                  <div className="flex items-center gap-3">
                    <Avatar src={item.photoUrl} icon={<UserRound size={16} />} />
                    <div>
                      <p className="font-medium text-slate-900">{item.name ?? '-'}</p>
                      <p className="text-xs text-slate-500">{item.email}</p>
                    </div>
                  </div>
                ),
              },
              { title: 'Số điện thoại', render: (_, item) => item.phoneNumber || '-' },
              {
                title: 'Trạng thái',
                render: (_, item) => (
                  <span className={item.isActive ? 'text-emerald-600' : 'text-slate-400'}>
                    {item.isActive ? 'Đang hoạt động' : 'Ngừng hoạt động'}
                  </span>
                ),
              },
              {
                title: 'Ngày tạo',
                dataIndex: 'createdAt',
                render: (value: string) => (value ? new Date(value).toLocaleDateString('vi-VN') : '-'),
              },
              {
                title: 'Thao tác',
                render: (_, item) => (
                  <Space>
                    {canEdit ? (
                      <Button type="link" onClick={() => void openEdit(item)}>
                        Sửa
                      </Button>
                    ) : null}
                    {canDelete ? (
                      <Popconfirm title="Xóa tài khoản này?" onConfirm={() => deleteMutation.mutate(item.id)}>
                        <Button type="link" danger loading={deleteMutation.isPending}>
                          Xóa
                        </Button>
                      </Popconfirm>
                    ) : null}
                  </Space>
                ),
              },
            ]}
          />
        </section>
      </PageShell>

      <Modal
        open={open}
        width={860}
        title={modalTitle}
        okText={editingAccount ? 'Lưu thay đổi' : 'Tạo tài khoản'}
        cancelText="Hủy"
        confirmLoading={createMutation.isPending || updateMutation.isPending}
        onCancel={() => {
          setOpen(false)
          setEditingAccount(null)
        }}
        onOk={async () => {
          const values = await form.validateFields()
          const payload = await buildPayload(values)

          if (editingAccount) {
            updateMutation.mutate(payload)
          } else {
            createMutation.mutate(payload)
          }
        }}
      >
        <Form form={form} layout="vertical" requiredMark={false} className="pt-2">
          <div className="grid gap-5 lg:grid-cols-[1fr_260px]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Thông tin chính</h3>
              <div className="grid gap-x-4 md:grid-cols-2">
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}>
                  <Input placeholder="email@example.com" />
                </Form.Item>
                <Form.Item name="name" label="Họ tên" rules={[{ required: true, message: 'Nhập họ tên' }]}>
                  <Input placeholder="Nguyễn Văn A" />
                </Form.Item>
                <Form.Item name="phone_number" label="Số điện thoại" rules={[{ required: true, message: 'Nhập số điện thoại' }]}>
                  <Input placeholder="0901234567" />
                </Form.Item>
                <Form.Item name="birthday" label="Ngày sinh">
                  <Input placeholder="dd/MM/yyyy" />
                </Form.Item>
                <Form.Item name="gender" label="Giới tính">
                  <Select
                    allowClear
                    placeholder="Chọn giới tính"
                    options={[
                      { value: 'male', label: 'Nam' },
                      { value: 'female', label: 'Nữ' },
                      { value: 'other', label: 'Khác' },
                    ]}
                  />
                </Form.Item>
                <Form.Item name="roles" label="Vai trò" rules={[{ required: true, message: 'Chọn ít nhất một vai trò' }]}>
                  <Select
                    mode="multiple"
                    loading={isLoadingRoles}
                    placeholder="Chọn vai trò"
                    options={roles.map((role) => ({ value: role.id, label: role.name }))}
                  />
                </Form.Item>
              </div>
              {editingAccount ? (
                <Form.Item name="is_active" label="Trạng thái" valuePropName="checked" className="mb-0">
                  <Switch checkedChildren="Hoạt động" unCheckedChildren="Khóa" />
                </Form.Item>
              ) : null}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Ảnh đại diện</h3>
              <Form.Item name="photo" label="URL ảnh">
                <Input placeholder="https://..." />
              </Form.Item>
              <Form.Item name="upload" label="Tải ảnh lên" valuePropName="fileList" getValueFromEvent={(event) => event?.fileList}>
                <Upload beforeUpload={() => false} maxCount={1} accept=".jpg,.jpeg,.png,.webp">
                  <Button icon={<UploadCloud size={16} />} className="w-full">
                    Chọn ảnh
                  </Button>
                </Upload>
              </Form.Item>
              <p className="text-xs leading-5 text-slate-500">
                Nếu chọn file, hệ thống sẽ upload ảnh trước rồi dùng đường dẫn trả về để lưu vào tài khoản.
              </p>
            </div>
          </div>
        </Form>
      </Modal>
    </>
  )
}
