import { Navigate, Outlet } from 'react-router-dom'
import { usePermission } from '../hooks/usePermission'
import { useAuthStore } from '../store/auth.store'

export default function PermissionRoute({ permission }: { permission?: string }) {
  const allowed = usePermission(permission ?? '')
  const firstMenuPath = useAuthStore((state) => state.menu[0]?.path)

  if (!permission) {
    return <Outlet />
  }

  if (!allowed) {
    return <Navigate to={firstMenuPath ?? '/profile'} replace />
  }

  return <Outlet />
}
