import { useEffect, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { App, Avatar, Button, Card, DatePicker, Divider, Form, Input, Modal, Progress, Radio, Tag, Upload } from 'antd'
import type { UploadFile } from 'antd'
import { Camera, CheckCircle2, KeyRound, LockKeyhole, Save, ShieldCheck, UserRound, XCircle } from 'lucide-react'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { accountApi } from '../../api/account.api'
import { commonApi } from '../../api/common.api'
import PageShell from '../../components/PageShell'
import { useAuthStore } from '../../store/auth.store'
import type { UpdateProfilePayload } from '../../types/account.types'

dayjs.extend(customParseFormat)

type ProfileFormValues = Omit<UpdateProfilePayload, 'birthday' | 'photo'> & {
  birthday?: dayjs.Dayjs | null
  upload?: UploadFile[]
}

interface ChangePasswordFormValues {
  current_password: string
  new_password: string
  repeat_new_password: string
}

const ROLE_COLORS: Record<string, string> = {
  administrator: 'red',
  admin: 'red',
  doctor: 'blue',
  employee: 'green',
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <div className="text-right text-sm font-medium text-slate-800">{children}</div>
    </div>
  )
}

function getPasswordScore(password = '') {
  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ]

  return checks.filter(Boolean).length
}

export default function ProfilePage() {
  const { message } = App.useApp()
  const setUser = useAuthStore((state) => state.setUser)
  const [form] = Form.useForm<ProfileFormValues>()
  const [passwordForm] = Form.useForm<ChangePasswordFormValues>()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState<string | null>(null)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const newPassword = Form.useWatch('new_password', passwordForm) ?? ''
  const passwordScore = getPasswordScore(newPassword)
  const passwordPercent = Math.min(100, passwordScore * 20)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['account', 'profile'],
    queryFn: () => accountApi.getProfile().then((res) => res.data.data),
    retry: 1,
  })

  useEffect(() => {
    if (!profile) return
    setCurrentPhotoUrl(profile.photoUrl ?? null)
    setPreviewUrl(profile.photoUrl ?? null)
    form.setFieldsValue({
      name: profile.name ?? '',
      phone_number: profile.phoneNumber ?? '',
      birthday: profile.birthday ? dayjs(profile.birthday, 'YYYY-MM-DD') : null,
      email: profile.email,
      gender: (profile.gender as 'male' | 'female' | 'other') ?? undefined,
      upload: [],
    })
  }, [form, profile])

  const updateMutation = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      let photo = currentPhotoUrl
      const file = values.upload?.[0]?.originFileObj

      if (file) {
        const uploadRes = await commonApi.uploadMedia(file)
        photo = uploadRes.data.data.path
        setCurrentPhotoUrl(photo)
      }

      const payload: UpdateProfilePayload = {
        name: values.name,
        phone_number: values.phone_number,
        birthday: values.birthday ? values.birthday.format('DD/MM/YYYY') : null,
        email: values.email,
        gender: values.gender,
        photo,
      }

      return accountApi.updateProfile(payload)
    },
    onSuccess: (res) => {
      setUser(res.data.data)
      form.setFieldValue('upload', [])
      message.success('Đã cập nhật hồ sơ thành công')
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message ?? 'Cập nhật hồ sơ thất bại'),
  })

  const changePasswordMutation = useMutation({
    mutationFn: (values: ChangePasswordFormValues) => accountApi.changePassword(values),
    onSuccess: (res) => {
      message.success(res.data.message)
      passwordForm.resetFields()
      setPasswordModalOpen(false)
    },
    onError: (err: any) =>
      message.error(err?.response?.data?.message ?? 'Đổi mật khẩu thất bại'),
  })

  return (
    <PageShell title="Hồ sơ cá nhân" description="Xem và cập nhật thông tin cá nhân của bạn.">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* ── Left panel ── */}
        <div className="w-full shrink-0 lg:w-72 xl:w-80">
          <Card loading={isLoading} className="overflow-hidden rounded-2xl p-0 shadow-[0_1px_2px_rgba(15,23,41,0.04)]" styles={{ body: { padding: 0 } }}>
            {/* Gradient banner */}
            <div className="h-28 bg-[#EFF6FF]" />

            {/* Avatar */}
            <div className="flex flex-col items-center px-6 pb-6">
              <div className="-mt-10 mb-3">
                <Avatar
                  size={80}
                  src={previewUrl}
                  icon={<UserRound size={32} />}
                  className="ring-4 ring-white shadow-md"
                />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                {profile?.name || profile?.email || '—'}
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">{profile?.email}</p>

              {/* Role badges */}
              {profile?.roles && profile.roles.length > 0 && (
                <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                  {profile.roles.map((r) => (
                    <Tag
                      key={r.id}
                      color={ROLE_COLORS[r.name.toLowerCase()] ?? 'default'}
                      className="rounded-full px-2.5 text-xs font-medium"
                    >
                      {r.name}
                    </Tag>
                  ))}
                </div>
              )}

              <Divider className="my-4" />

              <Button
                type="primary"
                size="large"
                icon={<LockKeyhole size={16} />}
                className="mb-4 h-11 w-full rounded-2xl bg-slate-950 shadow-[0_18px_40px_-18px_rgba(15,23,42,0.7)]"
                onClick={() => setPasswordModalOpen(true)}
              >
                Đổi mật khẩu
              </Button>

              {/* Info rows */}
              <div className="w-full divide-y divide-slate-100">
                <InfoRow label="Trạng thái">
                  {profile?.isActive ? (
                    <span className="flex items-center gap-1 text-emerald-600">
                      <CheckCircle2 size={14} />
                      Hoạt động
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-500">
                      <XCircle size={14} />
                      Ngừng hoạt động
                    </span>
                  )}
                </InfoRow>
                <InfoRow label="Tên đăng nhập">{profile?.username ?? '—'}</InfoRow>
                <InfoRow label="Xác minh email">
                  {profile?.emailVerifyAt
                    ? dayjs(profile.emailVerifyAt).format('DD/MM/YYYY')
                    : '—'}
                </InfoRow>
                <InfoRow label="Ngày tạo">
                  {profile?.createdAt
                    ? dayjs(profile.createdAt).format('DD/MM/YYYY')
                    : '—'}
                </InfoRow>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Right panel ── */}
        <div className="min-w-0 flex-1">
          <Card loading={isLoading} className="rounded-2xl shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
            <h3 className="mb-1 text-base font-semibold text-slate-900">Chỉnh sửa thông tin</h3>
            <p className="mb-6 text-sm text-slate-500">Cập nhật thông tin cá nhân của bạn bên dưới.</p>

            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
              onFinish={(values) => updateMutation.mutate(values)}
            >
              {/* Row 1 */}
              <div className="grid gap-x-5 md:grid-cols-2">
                <Form.Item
                  name="name"
                  label={<span className="font-medium text-slate-700">Họ tên</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                >
                  <Input size="large" placeholder="Nguyễn Văn A" />
                </Form.Item>

                <Form.Item
                  name="email"
                  label={<span className="font-medium text-slate-700">Email</span>}
                  rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}
                >
                  <Input size="large" placeholder="example@gmail.com" />
                </Form.Item>

                <Form.Item
                  name="phone_number"
                  label={<span className="font-medium text-slate-700">Số điện thoại</span>}
                  rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}
                >
                  <Input size="large" placeholder="09xx xxx xxx" />
                </Form.Item>

                <Form.Item
                  name="birthday"
                  label={<span className="font-medium text-slate-700">Ngày sinh</span>}
                >
                  <DatePicker
                    size="large"
                    className="w-full"
                    format="DD/MM/YYYY"
                    placeholder="Chọn ngày sinh"
                    allowClear
                  />
                </Form.Item>
              </div>

              {/* Gender */}
              <Form.Item
                name="gender"
                label={<span className="font-medium text-slate-700">Giới tính</span>}
              >
                <Radio.Group>
                  <Radio value="male">Nam</Radio>
                  <Radio value="female">Nữ</Radio>
                  <Radio value="other">Khác</Radio>
                </Radio.Group>
              </Form.Item>

              <Divider className="my-2" />

              {/* Avatar upload */}
              <Form.Item
                name="upload"
                label={<span className="font-medium text-slate-700">Ảnh đại diện</span>}
                valuePropName="fileList"
                getValueFromEvent={(e) => e?.fileList}
                extra="Chấp nhận file jpg, jpeg, png, webp. Tối đa 5 MB."
              >
                <Upload
                  beforeUpload={(file) => {
                    const objectUrl = URL.createObjectURL(file)
                    setPreviewUrl(objectUrl)
                    return false
                  }}
                  onRemove={() => {
                    setPreviewUrl(currentPhotoUrl)
                  }}
                  maxCount={1}
                  accept=".jpg,.jpeg,.png,.webp"
                  listType="picture"
                >
                  <Button icon={<Camera size={15} />} size="large">
                    Chọn ảnh mới
                  </Button>
                </Upload>
              </Form.Item>

              {/* Actions */}
              <div className="flex justify-end border-t border-slate-100 pt-5">
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={updateMutation.isPending}
                  icon={<Save size={15} />}
                  className="min-w-36"
                >
                  Lưu hồ sơ
                </Button>
              </div>
            </Form>
          </Card>
        </div>
      </div>

      <Modal
        open={passwordModalOpen}
        onCancel={() => {
          setPasswordModalOpen(false)
          passwordForm.resetFields()
        }}
        footer={null}
        width={720}
        centered
        destroyOnHidden
        className="profile-password-modal"
      >
        <div className="overflow-hidden rounded-[28px]">
          <div className="relative bg-slate-950 px-7 py-7 text-white">
            
            <div className="relative z-10 flex items-start gap-4">
              <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                <KeyRound size={26} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563EB]">Security vault</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">Đổi mật khẩu đăng nhập</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
                  Nhập mật khẩu hiện tại trước khi tạo mật khẩu mới. Thay đổi này có hiệu lực ngay cho lần đăng nhập tiếp theo.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 bg-white p-7 lg:grid-cols-[1fr_0.85fr]">
            <Form
              form={passwordForm}
              layout="vertical"
              size="large"
              requiredMark={false}
              onFinish={(values) => changePasswordMutation.mutate(values)}
            >
              <Form.Item
                name="current_password"
                label="Mật khẩu hiện tại"
                rules={[{ required: true, message: 'Nhập mật khẩu hiện tại' }]}
              >
                <Input.Password placeholder="Nhập mật khẩu hiện tại" />
              </Form.Item>

              <Form.Item
                name="new_password"
                label="Mật khẩu mới"
                rules={[
                  { required: true, message: 'Nhập mật khẩu mới' },
                  { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
                ]}
              >
                <Input.Password placeholder="Tạo mật khẩu mới" />
              </Form.Item>

              <Form.Item
                name="repeat_new_password"
                label="Nhập lại mật khẩu mới"
                dependencies={['new_password']}
                rules={[
                  { required: true, message: 'Nhập lại mật khẩu mới' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('new_password') === value) return Promise.resolve()
                      return Promise.reject(new Error('Mật khẩu nhập lại không khớp'))
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Xác nhận mật khẩu mới" />
              </Form.Item>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <Button
                  size="large"
                  className="rounded-2xl"
                  onClick={() => {
                    setPasswordModalOpen(false)
                    passwordForm.resetFields()
                  }}
                >
                  Hủy
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  size="large"
                  loading={changePasswordMutation.isPending}
                  icon={<ShieldCheck size={16} />}
                  className="rounded-2xl"
                >
                  Cập nhật mật khẩu
                </Button>
              </div>
            </Form>

            <aside className="rounded-[24px] border border-slate-100 bg-slate-50 p-5">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                <span>Độ mạnh</span>
                <span>{passwordScore >= 4 ? 'Tốt' : passwordScore >= 3 ? 'Khá' : 'Cần cải thiện'}</span>
              </div>
              <Progress
                className="mt-3"
                percent={passwordPercent}
                showInfo={false}
                strokeColor={passwordScore >= 4 ? '#10b981' : '#6366f1'}
              />
              <div className="mt-5 grid gap-3 text-sm text-slate-600">
                {['8+ ký tự', 'Chữ hoa', 'Chữ thường', 'Chữ số', 'Ký tự đặc biệt'].map((label, index) => {
                  const active = [
                    newPassword.length >= 8,
                    /[A-Z]/.test(newPassword),
                    /[a-z]/.test(newPassword),
                    /\d/.test(newPassword),
                    /[^A-Za-z0-9]/.test(newPassword),
                  ][index]
                  return (
                    <div key={label} className="flex items-center gap-2">
                      {active ? (
                        <CheckCircle2 size={16} className="text-emerald-500" />
                      ) : (
                        <span className="size-4 rounded-full border border-slate-300" />
                      )}
                      <span className={active ? 'font-medium text-slate-900' : ''}>{label}</span>
                    </div>
                  )
                })}
              </div>
            </aside>
          </div>
        </div>
      </Modal>
    </PageShell>
  )
}
