import { useState } from 'react'
import { Alert, Button, Form, Input, message } from 'antd'
import { ShieldCheck, Stethoscope, UploadCloud } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth.api'
import { accountApi } from '../../api/account.api'
import { configApi } from '../../api/config.api'
import { useAuthStore } from '../../store/auth.store'
import type { LoginPayload } from '../../types/auth.types'

const features = [
  { icon: UploadCloud, title: 'Tải hồ sơ OCR', text: 'Kéo thả ảnh hoặc PDF, theo dõi xử lý và chỉnh sửa dữ liệu OCR ngay trên web.' },
  { icon: Stethoscope, title: 'Bác sĩ phê duyệt', text: 'Bác sĩ kiểm tra, phê duyệt hoặc từ chối bệnh án có lý do rõ ràng.' },
  { icon: ShieldCheck, title: 'Phân quyền rõ ràng', text: 'Sidebar, route và thao tác bám theo menu phân quyền thực tế từ backend.' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuth, setMenu, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: LoginPayload) => {
    setLoading(true)

    try {
      const authResponse = await authApi.login(values)
      const { token, refreshToken } = authResponse.data.data

      setAuth(token, refreshToken)

      const [profileResponse, menuResponse] = await Promise.all([
        accountApi.getProfile(),
        configApi.getPermissionMenu(),
      ])
      setUser(profileResponse.data.data)
      setMenu(menuResponse.data.data)

      navigate('/dashboard', { replace: true })
    } catch (error: any) {
      message.error(error?.response?.data?.message ?? 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.18),_transparent_32%),linear-gradient(180deg,_#f8fafc,_#eef2ff_45%,_#f8fafc)] lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden border-r border-white/60 px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-500">Medical Frontend Plan</p>
          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight tracking-tight text-slate-950">
            MED-OCR vận hành quy trình bệnh án số từ tải lên đến phê duyệt.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Giao diện tập trung cho nhân viên, bác sĩ và quản trị viên, ưu tiên tốc độ kiểm tra dữ liệu OCR và tính minh bạch của phân quyền.
          </p>
        </div>

        <div className="grid gap-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-[0_18px_60px_-32px_rgba(15,23,42,0.35)] backdrop-blur">
              <div className="flex items-start gap-4">
                <div className="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Icon size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{text}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="flex items-center justify-center px-4 py-12 md:px-8">
        <div className="w-full max-w-md rounded-[32px] border border-white/70 bg-white/85 p-8 shadow-[0_28px_80px_-40px_rgba(15,23,42,0.45)] backdrop-blur-xl">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-indigo-500">Đăng nhập</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Truy cập hệ thống MED-OCR</h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Dùng tài khoản backend hiện tại để đăng nhập, lấy hồ sơ cá nhân và menu phân quyền.
            </p>
          </div>

          <Alert
            type="info"
            showIcon
            className="mb-6 rounded-2xl"
            message="Tài khoản mẫu"
            description="hoa1312004@gmail.com / Aa123456"
          />

          <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}>
              <Input placeholder="email@example.com" />
            </Form.Item>

            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
              <Input.Password placeholder="••••••••" />
            </Form.Item>

            <Button type="primary" htmlType="submit" loading={loading} className="mt-2 h-12 w-full rounded-2xl text-sm font-semibold">
              Đăng nhập
            </Button>
          </Form>

          <Link to="/register" className="mt-5 block text-center text-sm font-medium text-indigo-600">
            Tạo tài khoản mới
          </Link>
        </div>
      </section>
    </main>
  )
}
