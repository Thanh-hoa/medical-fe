import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AccountInfo } from '../types/account.types'
import type { AppRole, PermissionMenuItem } from '../types/auth.types'

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AccountInfo | null
  menu: PermissionMenuItem[]
  permissions: string[]
  role: AppRole | null
  setAuth: (token: string, refreshToken: string) => void
  setUser: (user: AccountInfo | null) => void
  setMenu: (menu: PermissionMenuItem[]) => void
  logout: () => void
}

function normalizeRole(user: AccountInfo | null): AppRole | null {
  const rawRole = (user?.roles?.[0]?.name ?? '').toLowerCase()
  const roleNameMap: Record<string, AppRole> = {
    admin: 'admin',
    administrator: 'admin',
    'quan tri vien': 'admin',
    'quản trị viên': 'admin',
    doctor: 'doctor',
    'bac si': 'doctor',
    'bác sĩ': 'doctor',
    employee: 'employee',
    'nhan vien': 'employee',
    'nhân viên': 'employee',
    patient: 'patient',
    'benh nhan': 'patient',
    'bệnh nhân': 'patient',
  }

  return roleNameMap[rawRole] ?? null
}

function menuToPermissions(menu: PermissionMenuItem[]): string[] {
  return menu.flatMap((item) => item.actions.map((action) => `${item.key}:${action}`))
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      refreshToken: null,
      user: null,
      menu: [],
      permissions: [],
      role: null,

      setAuth: (token, refreshToken) => {
        set({ token, refreshToken })
      },

      setUser: (user) => {
        set({ user, role: normalizeRole(user) })
      },

      setMenu: (menu) => {
        set({ menu, permissions: menuToPermissions(menu) })
      },

      logout: () =>
        set({
          token: null,
          refreshToken: null,
          user: null,
          menu: [],
          permissions: [],
          role: null,
        }),
    }),
    {
      name: 'med-ocr-auth',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        menu: state.menu,
        permissions: state.permissions,
        role: state.role,
      }),
    },
  ),
)
