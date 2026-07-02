import { useState } from 'react'
import { Alert, Button, Form, Input, message } from 'antd'
import { ShieldCheck, Stethoscope, UploadCloud } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../../api/auth.api'
import { accountApi } from '../../api/account.api'
import { configApi } from '../../api/config.api'
import { useAuthStore } from '../../store/auth.store'
import type { AccountInfo } from '../../types/account.types'
import type { LoginPayload, PermissionMenuItem } from '../../types/auth.types'

const features = [
  { icon: UploadCloud, title: 'Tải hồ sơ OCR', text: 'Kéo thả ảnh hoặc PDF, theo dõi xử lý và chỉnh sửa dữ liệu OCR ngay trên web.' },
  { icon: Stethoscope, title: 'Bác sĩ phê duyệt', text: 'Bác sĩ kiểm tra, phê duyệt hoặc từ chối bệnh án có lý do rõ ràng.' },
  { icon: ShieldCheck, title: 'Phân quyền rõ ràng', text: 'Sidebar, route và thao tác bám theo menu phân quyền thực tế từ backend.' },
]

function isPatientAccount(user: AccountInfo) {
  return user.roles?.some((role) => {
    const roleName = role.name.toLowerCase()
    return roleName === 'patient' || roleName === 'benh nhan' || roleName === 'bệnh nhân'
  })
}

function ensurePatientSelfMenu(menu: PermissionMenuItem[], user: AccountInfo): PermissionMenuItem[] {
  if (!isPatientAccount(user) || menu.some((item) => item.key === 'patient-self')) {
    return menu
  }

  return [
    ...menu,
    {
      id: -1,
      key: 'patient-self',
      label: 'Bệnh án của tôi',
      path: '/my-medical-records',
      actions: ['view'],
    },
  ]
}

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
      const user = profileResponse.data.data
      const menu = ensurePatientSelfMenu(menuResponse.data.data, user)

      setUser(user)
      setMenu(menu)

      navigate(menu[0]?.path ?? '/profile', { replace: true })
    } catch (error: any) {
      message.error(error?.response?.data?.message ?? 'Đăng nhập thất bại')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-[#F7F9FC] lg:grid-cols-[1.1fr_0.9fr]">
      <section className="hidden border-r border-white/60 px-10 py-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563EB]">Medical Frontend Plan</p>
          <h1 className="mt-5 max-w-xl text-5xl font-semibold leading-tight tracking-tight text-slate-950">
            MED-OCR vận hành quy trình bệnh án số từ tải lên đến phê duyệt.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            Giao diện tập trung cho nhân viên, bác sĩ và quản trị viên, ưu tiên tốc độ kiểm tra dữ liệu OCR và tính minh bạch của phân quyền.
          </p>
        </div>

        <div className="grid gap-4">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-xl border border-[#E5EAF1] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
              <div className="flex items-start gap-4">
                <div className="grid size-12 place-items-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
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
        <div className="w-full max-w-md rounded-xl border border-[#E5EAF1] bg-white p-8 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2563EB]">Đăng nhập</p>
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

          <Link to="/forgot-password" className="mt-4 block text-center text-sm font-semibold text-slate-500 hover:text-[#2563EB]">
            Quên mật khẩu?
          </Link>

          <Link to="/register" className="mt-5 block text-center text-sm font-medium text-[#2563EB]">
            Tạo tài khoản mới
          </Link>
        </div>
      </section>
    </main>
  )
}
