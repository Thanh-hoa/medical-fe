import { useEffect, useState } from 'react'
import { Alert, Button, Spin } from 'antd'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { accountApi } from '../../api/account.api'

function isAlreadyActivated(message: string) {
  return message.toLowerCase().includes('đã được kích hoạt') || message.toLowerCase().includes('da duoc kich hoat')
}

export default function ValidateTokenPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    let redirectTimer: ReturnType<typeof setTimeout> | undefined

    if (!token) {
      setStatus('error')
      setMessage('Thiếu token kích hoạt')
      return undefined
    }

    accountApi
      .validateToken(token)
      .then((response) => {
        const responseMessage = response.data.message || 'Kích hoạt tài khoản thành công'

        if (response.data.isError && !isAlreadyActivated(responseMessage)) {
          setStatus('error')
          setMessage(responseMessage)
          return
        }

        setStatus('success')
        setMessage(responseMessage)
        redirectTimer = setTimeout(() => navigate('/login', { replace: true }), 1800)
      })
      .catch((error) => {
        const responseMessage = error?.response?.data?.message ?? 'Kích hoạt tài khoản thất bại'

        if (isAlreadyActivated(responseMessage)) {
          setStatus('success')
          setMessage(responseMessage)
          redirectTimer = setTimeout(() => navigate('/login', { replace: true }), 1800)
          return
        }

        setStatus('error')
        setMessage(responseMessage)
      })

    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer)
      }
    }
  }, [navigate, searchParams])

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <section className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
        {status === 'loading' ? (
          <Spin tip="Đang kích hoạt tài khoản" />
        ) : (
          <>
            <Alert type={status === 'success' ? 'success' : 'error'} showIcon message={message} />
            {status === 'success' ? <p className="mt-4 text-sm text-slate-500">Đang chuyển về trang đăng nhập...</p> : null}
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
