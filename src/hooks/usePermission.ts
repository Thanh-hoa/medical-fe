import { useAuthStore } from '../store/auth.store'

export function usePermission(permission: string): boolean {
  return useAuthStore((state) => state.permissions.includes(permission))
}

export function useRole() {
  return useAuthStore((state) => state.role)
}
