import { useState } from 'react'
import {
  CheckSquare,
  ClipboardList,
  History,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
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
    <span
      data-role-pill
      className="inline-flex rounded-full border border-[#C9D6F0] bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-semibold tracking-[0.2em] text-[#2563EB]"
    >
      {label}
    </span>
  )
}

export default function MainLayout() {
  const { menu, user, role } = useAuthStore()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const visibleMenu = menu.filter((item) => item.key !== 'webhooks' && item.path !== '/webhooks')

  return (
    <div className="flex min-h-screen items-start bg-[#F7F9FC]">
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#DDE6F3] bg-white text-slate-700 shadow-[10px_0_30px_-28px_rgba(15,23,42,0.38)] transition-[width] duration-200 lg:flex',
          sidebarCollapsed ? 'w-24' : 'w-80',
          sidebarCollapsed && 'app-sidebar-collapsed',
        )}
      >
        <div className={cn('border-b border-[#E5EAF1] py-8', sidebarCollapsed ? 'px-4' : 'px-7')}>
          <div className={cn('flex items-center', sidebarCollapsed ? 'justify-center' : 'gap-4')}>
            <div className="grid size-12 place-items-center rounded-xl bg-[#2563EB] text-white shadow-[0_12px_28px_-18px_rgba(37,99,235,0.8)]">
              <UserSquare2 size={22} />
            </div>
            <div className={cn(sidebarCollapsed && 'hidden')}>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#2563EB]">Hồ sơ số</p>
              <h1 className="mt-1 text-xl font-semibold text-[#0F172A]">MED-OCR</h1>
            </div>
          </div>
          <button
            type="button"
            aria-label={sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            title={sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
            className={cn(
              'mt-5 inline-flex h-10 items-center justify-center rounded-xl border border-[#DDE6F3] bg-white text-[#2563EB] transition hover:border-[#C9D6F0] hover:bg-[#EFF6FF]',
              'w-full',
            )}
            onClick={() => setSidebarCollapsed((value) => !value)}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <nav className={cn('flex-1 overflow-y-auto pb-6', sidebarCollapsed ? 'px-3' : 'px-4')}>
          <div className="mb-7">
            <p className={cn('px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#64748B]', sidebarCollapsed && 'text-center')}>
              {sidebarCollapsed ? 'Nav' : 'Navigation'}
            </p>
            <div className="mt-3 space-y-1">
              {visibleMenu.map((item) => {
                const Icon = menuIconMap[item.key] ?? LayoutDashboard
                const label = menuLabelMap[item.key] ?? item.label
                const path = item.key === 'patient-search' ? '/patients' : item.path
                return (
                  <NavLink
                    key={item.key}
                    to={path}
                    title={label}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center rounded-xl border text-sm font-medium transition-all duration-150',
                        sidebarCollapsed ? 'justify-center px-0 py-3' : 'gap-3 px-4 py-3',
                        isActive
                          ? 'border-[#C9D6F0] bg-[#EFF6FF] text-[#1D4ED8] shadow-[0_10px_24px_-20px_rgba(37,99,235,0.8)]'
                          : 'border-transparent text-slate-600 hover:border-[#E5EAF1] hover:bg-[#F7F9FC] hover:text-[#0F172A]',
                      )
                    }
                  >
                    <Icon size={18} />
                    <span className={cn(sidebarCollapsed && 'hidden')}>{label}</span>
                  </NavLink>
                )
              })}
            </div>
          </div>
        </nav>

        <div className={cn('border-t border-[#E5EAF1]', sidebarCollapsed ? 'p-3' : 'p-5')}>
          <div className="app-sidebar-user rounded-xl border border-[#E5EAF1] bg-[#F7F9FC] p-4">
            <div className="app-sidebar-user-icon hidden place-items-center text-[#2563EB]" title={user?.email ?? undefined}>
              <UserSquare2 size={20} />
            </div>
            <p className="text-sm font-medium text-[#0F172A]">{user?.name ?? user?.email ?? 'Chưa có hồ sơ'}</p>
            <p className="mt-1 text-sm text-[#64748B]">{user?.email ?? 'Không có email'}</p>
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
