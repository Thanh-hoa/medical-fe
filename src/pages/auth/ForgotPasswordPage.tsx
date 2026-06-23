import { useState } from 'react'
import { App, Button, Form, Input } from 'antd'
import { ArrowLeft, MailCheck, SendHorizontal, ShieldQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'
import { authApi } from '../../api/auth.api'
import type { ForgotPasswordPayload } from '../../types/auth.types'

export default function ForgotPasswordPage() {
  const { message } = App.useApp()
  const [sentEmail, setSentEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: ForgotPasswordPayload) => {
    setLoading(true)

    try {
      const response = await authApi.forgotPassword(values)
      setSentEmail(values.email)
      message.success(response.data.message)
    } catch (error: any) {
      message.error(error?.response?.data?.message ?? 'Không thể gửi email đặt lại mật khẩu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center">
        <div className="grid w-full overflow-hidden rounded-xl border border-[#E5EAF1] bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)] lg:grid-cols-[0.95fr_1.05fr]">
          <div className="relative hidden min-h-[620px] overflow-hidden bg-slate-950 p-10 text-white lg:block">
            
            <div className="relative z-10 flex h-full flex-col justify-between">
              <div>
                <div className="grid size-14 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
                  <ShieldQuestion size={26} />
                </div>
                <h1 className="mt-8 max-w-sm text-5xl font-semibold leading-tight tracking-tight">
                  Khôi phục quyền truy cập an toàn.
                </h1>
                <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
                  Hệ thống gửi liên kết đặt lại mật khẩu qua email. Token chỉ có hiệu lực trong 15 phút.
                </p>
              </div>

              <div className="grid gap-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  Không tiết lộ email có tồn tại trong hệ thống hay không.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4">
                  Sau khi đặt lại thành công, quay lại đăng nhập bằng mật khẩu mới.
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center px-5 py-10 sm:px-10">
            <div className="w-full max-w-md">
              <Link to="/login" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#2563EB]">
                <ArrowLeft size={16} />
                Quay lại đăng nhập
              </Link>

              {sentEmail ? (
                <div className="rounded-[28px] border border-emerald-100 bg-emerald-50/80 p-8 text-center">
                  <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-emerald-500 text-white shadow-[0_18px_40px_-18px_rgba(16,185,129,0.8)]">
                    <MailCheck size={30} />
                  </div>
                  <h2 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">Kiểm tra email của bạn</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    Nếu tài khoản tồn tại, liên kết đặt lại mật khẩu đã được gửi đến {sentEmail}.
                  </p>
                  <Button type="primary" size="large" className="mt-7 h-12 rounded-2xl" onClick={() => setSentEmail(null)}>
                    Gửi lại email khác
                  </Button>
                </div>
              ) : (
                <>
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-600">Quên mật khẩu</p>
                  <h2 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">Nhận liên kết đặt lại</h2>
                  <p className="mt-4 text-sm leading-6 text-slate-500">
                    Nhập email đã đăng ký. Hệ thống sẽ gửi đường dẫn đặt mật khẩu mới nếu email hợp lệ.
                  </p>

                  <Form className="mt-8" layout="vertical" size="large" requiredMark={false} onFinish={onFinish}>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}>
                      <Input placeholder="email@example.com" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} icon={<SendHorizontal size={16} />} className="h-12 w-full rounded-2xl font-semibold">
                      Gửi liên kết đặt lại
                    </Button>
                  </Form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
