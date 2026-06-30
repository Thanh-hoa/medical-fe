import { Avatar, Dropdown } from 'antd'
import { ChevronDown, LogOut, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '../api/auth.api'
import { useAuthStore } from '../store/auth.store'
import NotificationDrawer from '../components/NotificationDrawer'

export default function Header() {
  const navigate = useNavigate()
  const { logout, token, user, role } = useAuthStore()

  const handleLogout = async () => {
    if (token) {
      await authApi.logout(token).catch(() => undefined)
    }

    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-20 border-b border-[#E5EAF1] bg-white/95">
      <div className="flex h-18 items-center justify-between px-5 md:px-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563EB]">MED-OCR</p>
          <p className="mt-1 text-sm font-medium text-[#0F172A]">Hệ thống xử lý bệnh án và OCR nội bộ</p>
        </div>

        <div className="flex items-center gap-3">
          <NotificationDrawer />

          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'profile',
                  icon: <UserRound size={16} />,
                  label: 'Hồ sơ cá nhân',
                },
                {
                  key: 'logout',
                  danger: true,
                  icon: <LogOut size={16} />,
                  label: 'Đăng xuất',
                },
              ],
              onClick: ({ key }) => {
                if (key === 'profile') {
                  navigate('/profile')
                }
                if (key === 'logout') {
                  void handleLogout()
                }
              },
            }}
          >
            <button
              type="button"
              className="flex items-center gap-3 rounded-xl border border-[#E5EAF1] bg-[#F7F9FC] px-3 py-2 text-left transition hover:border-[#C9D6F0] hover:bg-[#EFF6FF]"
            >
              <Avatar src={user?.photoUrl} icon={<UserRound size={16} />} />
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-slate-900">{user?.name ?? user?.email ?? 'Người dùng'}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{role ?? 'unknown'}</p>
              </div>
              <ChevronDown size={16} className="text-slate-400" />
            </button>
          </Dropdown>
        </div>
      </div>
    </header>
  )
}
