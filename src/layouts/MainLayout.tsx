import {
  CheckSquare,
  ClipboardList,
  History,
  LayoutDashboard,
  Shield,
  UserSquare2,
  Users,
} from 'lucide-react'
import { NavLink, Outlet } from 'react-router-dom'
import Header from './Header'
import { cn } from '../lib/cn'
import { useAuthStore } from '../store/auth.store'

const menuIconMap: Record<string, typeof LayoutDashboard> = {
  dashboard: LayoutDashboard,
  'audit-logs': History,
  accounts: Shield,
  'medical-records': ClipboardList,
  'medical-records-approval': CheckSquare,
  'patient-search': Users,
}

const menuLabelMap: Record<string, string> = {
  dashboard: 'Bảng điều khiển',
  'audit-logs': 'Nhật ký thao tác',
  accounts: 'Quản lý tài khoản',
  'medical-records': 'Hồ sơ bệnh án',
  'medical-records-approval': 'Phê duyệt bệnh án',
  'patient-search': 'Quản lý bệnh nhân',
}

function RolePill({ role }: { role: string | null }) {
  const label = role ? role.toUpperCase() : 'UNKNOWN'

  return (
    <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold tracking-[0.2em] text-slate-200">
      {label}
    </span>
  )
}

export default function MainLayout() {
  const { menu, user, role } = useAuthStore()
  const visibleMenu = menu.filter((item) => item.key !== 'webhooks' && item.path !== '/webhooks')

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-80 shrink-0 flex-col bg-slate-950 text-slate-300 lg:flex">
        <div className="px-7 py-8">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-400 text-white shadow-lg shadow-indigo-950/30">
              <UserSquare2 size={22} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Hồ sơ số</p>
              <h1 className="mt-1 text-xl font-semibold text-white">MED-OCR</h1>
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="mb-7">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Menu</p>
            <div className="mt-3 space-y-1">
              {visibleMenu.map((item) => {
                const Icon = menuIconMap[item.key] ?? LayoutDashboard
                return (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-2xl border-l-2 px-4 py-3 text-sm font-medium transition-all duration-150',
                        isActive
                          ? 'border-indigo-500 bg-slate-800 text-white'
                          : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-white',
                      )
                    }
                  >
                    <Icon size={18} />
                    <span>{menuLabelMap[item.key] ?? item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        </nav>

        <div className="border-t border-white/10 p-5">
          <div className="rounded-3xl bg-white/5 p-4">
            <p className="text-sm font-medium text-white">{user?.name ?? user?.email ?? 'Chưa có hồ sơ'}</p>
            <p className="mt-1 text-sm text-slate-400">{user?.email ?? 'Không có email'}</p>
            <div className="mt-4">
              <RolePill role={role} />
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <Header />
        <main className="px-4 py-6 md:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
