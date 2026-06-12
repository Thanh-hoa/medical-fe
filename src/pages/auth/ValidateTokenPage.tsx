import { useEffect, useState } from 'react'
import { Alert, Button, Spin } from 'antd'
import { Link, useSearchParams } from 'react-router-dom'
import { accountApi } from '../../api/account.api'

export default function ValidateTokenPage() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('Thiếu token kích hoạt')
      return
    }

    accountApi
      .validateToken(token)
      .then((response) => {
        setStatus('success')
        setMessage(response.data.message || 'Kích hoạt tài khoản thành công')
      })
      .catch((error) => {
        setStatus('error')
        setMessage(error?.response?.data?.message ?? 'Kích hoạt tài khoản thất bại')
      })
  }, [searchParams])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        {status === 'loading' ? (
          <Spin tip="Đang kích hoạt tài khoản" />
        ) : (
          <>
            <Alert type={status === 'success' ? 'success' : 'error'} showIcon message={message} />
            <Link to="/login">
              <Button type="primary" className="mt-6">
                Về trang đăng nhập
              </Button>
            </Link>
          </>
        )}
      </section>
    </main>
  )
}
