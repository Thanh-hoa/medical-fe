import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App, Button, Form, Input, Modal, Popconfirm, Select, Space, Switch, Table } from 'antd'
import { accountApi } from '../../api/account.api'
import PageShell from '../../components/PageShell'
import type { AccountInfo, UpsertAccountPayload } from '../../types/account.types'
import type { AppRole } from '../../types/auth.types'

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'employee', label: 'Employee' },
]

type AccountFormValues = UpsertAccountPayload & { isActive?: boolean }

export default function AccountListPage() {
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const [filters, setFilters] = useState({ q: '', page: 1, limit: 10 })
  const [open, setOpen] = useState(false)
  const [editingAccount, setEditingAccount] = useState<AccountInfo | null>(null)
  const [form] = Form.useForm<AccountFormValues>()

  const { data, isLoading } = useQuery({
    queryKey: ['accounts', filters],
    queryFn: () => accountApi.list(filters).then((response) => response.data.data),
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
    mutationFn: (id: string) => accountApi.delete([id]),
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
    form.setFieldsValue({ roles: ['employee'] })
    setOpen(true)
  }

  const openEdit = (account: AccountInfo) => {
    setEditingAccount(account)
    form.setFieldsValue({
      id: account.id,
      email: account.email,
      name: account.name ?? '',
      phoneNumber: account.phoneNumber ?? '',
      birthday: account.birthday ?? '',
      gender: account.gender ?? '',
      photoUrl: account.photoUrl ?? '',
      roles: ((account.roles as AppRole[] | undefined) ?? ['employee']) as AppRole[],
      isActive: account.isActive,
    })
    setOpen(true)
  }

  return (
    <>
      <PageShell
        title="Quản lý tài khoản"
        description="Admin có thể xem danh sách, tạo, cập nhật và xóa mềm tài khoản từ endpoint account hiện có."
        actions={
          <Button type="primary" size="large" onClick={openCreate}>
            Thêm tài khoản
          </Button>
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
              { title: 'Tên', render: (_, item) => item.name ?? '-' },
              { title: 'Email', dataIndex: 'email' },
              {
                title: 'Trạng thái',
                render: (_, item) => (
                  <span className={item.isActive ? 'text-emerald-600' : 'text-slate-400'}>
                    {item.isActive ? 'Active' : 'Inactive'}
                  </span>
                ),
              },
              {
                title: 'Ngày tạo',
                dataIndex: 'createdAt',
                render: (value: string) => new Date(value).toLocaleDateString('vi-VN'),
              },
              {
                title: 'Thao tác',
                render: (_, item) => (
                  <Space>
                    <Button type="link" onClick={() => openEdit(item)}>
                      Sửa
                    </Button>
                    <Popconfirm title="Xóa tài khoản này?" onConfirm={() => deleteMutation.mutate(item.id)}>
                      <Button type="link" danger loading={deleteMutation.isPending}>
                        Xóa
                      </Button>
                    </Popconfirm>
                  </Space>
                ),
              },
            ]}
          />
        </section>
      </PageShell>

      <Modal
        open={open}
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
          const payload: UpsertAccountPayload = {
            id: editingAccount?.id,
            email: values.email,
            name: values.name,
            phoneNumber: values.phoneNumber,
            birthday: values.birthday,
            gender: values.gender,
            photoUrl: values.photoUrl,
            roles: values.roles,
          }

          if (editingAccount) {
            updateMutation.mutate(payload)
          } else {
            createMutation.mutate(payload)
          }
        }}
      >
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Tên">
            <Input />
          </Form.Item>
          <Form.Item name="phoneNumber" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="birthday" label="Ngày sinh">
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="gender" label="Giới tính">
            <Input />
          </Form.Item>
          <Form.Item name="photoUrl" label="Photo URL">
            <Input />
          </Form.Item>
          <Form.Item
            name="roles"
            label="Roles"
            rules={[{ required: true, message: 'Chọn ít nhất một role' }]}
          >
            <Select mode="multiple" options={roleOptions} />
          </Form.Item>
          {editingAccount ? (
            <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" disabled />
            </Form.Item>
          ) : null}
        </Form>
      </Modal>
    </>
  )
}
