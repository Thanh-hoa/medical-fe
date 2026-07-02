export interface LoginPayload {
  email: string
  password: string
}

export interface AuthTokens {
  token: string
  refreshToken: string
  userId: number
  username: string
}

export interface RefreshTokenPayload {
  refreshToken: string
}

export interface ForgotPasswordPayload {
  email: string
}

export interface ResetPasswordPayload {
  token: string
  password: string
  repeat_password: string
}

export type AppRole = 'employee' | 'doctor' | 'admin' | 'patient'

export interface PermissionMenuItem {
  id: number
  key: string
  label: string
  path: string
  actions: string[]
}
