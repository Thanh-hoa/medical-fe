import { App, Button, Form, Input } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { accountApi } from '../../api/account.api'
import type { RegisterAccountPayload } from '../../types/account.types'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const onFinish = async (values: RegisterAccountPayload) => {
    try {
      await accountApi.register(values)
      message.success('Đăng ký tài khoản thành công')
      navigate('/login', { replace: true })
    } catch (error: any) {
      message.error(error?.response?.data?.message ?? 'Đăng ký tài khoản thất bại')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#2563EB]">Đăng ký</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Tạo tài khoản</h1>
        <Form className="mt-8" layout="vertical" size="large" requiredMark={false} onFinish={onFinish}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Nhập email hợp lệ' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="repeatPassword"
            label="Nhập lại mật khẩu"
            dependencies={['password']}
            rules={[
              { required: true, message: 'Nhập lại mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) return Promise.resolve()
                  return Promise.reject(new Error('Mật khẩu nhập lại không khớp'))
                },
              }),
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" className="h-12 w-full">
            Đăng ký
          </Button>
        </Form>
        <Link to="/login" className="mt-5 block text-center text-sm text-[#2563EB]">
          Đã có tài khoản? Đăng nhập
        </Link>
      </section>
    </main>
  )
}
