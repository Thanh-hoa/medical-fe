import { useMemo, useState } from 'react'
import { App, Button, Form, Input, Progress } from 'antd'
import { ArrowLeft, CheckCircle2, KeyRound, LockKeyhole, XCircle } from 'lucide-react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authApi } from '../../api/auth.api'

interface ResetPasswordFormValues {
  password: string
  repeat_password: string
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

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [searchParams] = useSearchParams()
  const [form] = Form.useForm<ResetPasswordFormValues>()
  const [loading, setLoading] = useState(false)
  const password = Form.useWatch('password', form) ?? ''
  const token = searchParams.get('token') ?? ''

  const score = useMemo(() => getPasswordScore(password), [password])
  const percent = Math.min(100, score * 20)

  const onFinish = async (values: ResetPasswordFormValues) => {
    if (!token) {
      message.error('Thiếu token đặt lại mật khẩu')
      return
    }

    setLoading(true)

    try {
      const response = await authApi.resetPassword({
        token,
        password: values.password,
        repeat_password: values.repeat_password,
      })
      message.success(response.data.message)
      navigate('/login', { replace: true })
    } catch (error: any) {
      message.error(error?.response?.data?.message ?? 'Đặt lại mật khẩu thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-10 text-[#0F172A]">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl items-center justify-center">
        <div className="w-full overflow-hidden rounded-xl border border-[#E5EAF1] bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative p-8 sm:p-10">
              
              <div className="relative z-10 flex h-full min-h-[360px] flex-col justify-between">
                <Link to="/login" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-slate-300 hover:text-[#0F172A]">
                  <ArrowLeft size={16} />
                  Đăng nhập
                </Link>
                <div>
                  <div className="grid size-16 place-items-center rounded-3xl bg-[#EFF6FF] text-[#2563EB] shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
                    <LockKeyhole size={30} />
                  </div>
                  <h1 className="mt-8 max-w-sm text-5xl font-semibold leading-tight tracking-tight">
                    Tạo mật khẩu mới.
                  </h1>
                  <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
                    Hoàn tất trước khi token hết hạn. Mật khẩu mạnh giúp bảo vệ dữ liệu bệnh án và tài khoản nội bộ.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 text-slate-950 sm:p-10">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2563EB]">Reset password</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Đặt lại mật khẩu</h2>

              {!token ? (
                <div className="mt-8 rounded-3xl border border-red-100 bg-red-50 p-6 text-red-700">
                  <div className="flex items-center gap-3 font-semibold">
                    <XCircle size={20} />
                    Link đặt lại mật khẩu không hợp lệ
                  </div>
                  <p className="mt-2 text-sm leading-6">Vui lòng yêu cầu gửi lại email đặt lại mật khẩu.</p>
                  <Link to="/forgot-password">
                    <Button className="mt-5 rounded-2xl">Gửi lại email</Button>
                  </Link>
                </div>
              ) : (
                <Form form={form} className="mt-8" layout="vertical" size="large" requiredMark={false} onFinish={onFinish}>
                  <Form.Item
                    name="password"
                    label="Mật khẩu mới"
                    rules={[{ required: true, message: 'Nhập mật khẩu mới' }, { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' }]}
                  >
                    <Input.Password placeholder="Nhập mật khẩu mới" />
                  </Form.Item>

                  <div className="mb-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      <span>Độ mạnh</span>
                      <span>{score >= 4 ? 'Tốt' : score >= 3 ? 'Khá' : 'Cần cải thiện'}</span>
                    </div>
                    <Progress className="mt-2" percent={percent} showInfo={false} strokeColor={score >= 4 ? '#10b981' : '#6366f1'} />
                    <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                      {['8+ ký tự', 'Chữ hoa', 'Chữ thường', 'Chữ số', 'Ký tự đặc biệt'].map((label, index) => {
                        const active = [
                          password.length >= 8,
                          /[A-Z]/.test(password),
                          /[a-z]/.test(password),
                          /\d/.test(password),
                          /[^A-Za-z0-9]/.test(password),
                        ][index]
                        return (
                          <span key={label} className={active ? 'text-emerald-600' : ''}>
                            {active ? '✓' : '•'} {label}
                          </span>
                        )
                      })}
                    </div>
                  </div>

                  <Form.Item
                    name="repeat_password"
                    label="Nhập lại mật khẩu"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Nhập lại mật khẩu mới' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) return Promise.resolve()
                          return Promise.reject(new Error('Mật khẩu nhập lại không khớp'))
                        },
                      }),
                    ]}
                  >
                    <Input.Password placeholder="Nhập lại mật khẩu mới" />
                  </Form.Item>

                  <Button type="primary" htmlType="submit" loading={loading} icon={<KeyRound size={16} />} className="h-12 w-full rounded-2xl font-semibold">
                    Cập nhật mật khẩu
                  </Button>

                  <div className="mt-5 flex items-center gap-2 text-sm text-emerald-600">
                    <CheckCircle2 size={16} />
                    Sau khi thành công, bạn sẽ được chuyển về trang đăng nhập.
                  </div>
                </Form>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
