import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth.store'

export default function DefaultRedirect() {
  const firstMenuPath = useAuthStore((state) => state.menu[0]?.path)

  return <Navigate to={firstMenuPath ?? '/profile'} replace />
}
