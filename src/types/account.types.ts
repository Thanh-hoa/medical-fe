import type { AppRole } from './auth.types'

export interface RoleInfo {
  id: number
  name: string
}

export interface AccountInfo {
  id: string
  name: string | null
  birthday: string | null
  phoneNumber: string | null
  username: string
  email: string
  isActive: boolean
  emailVerifyAt: string | null
  photoUrl: string | null
  createdAt: string
  updatedAt: string | null
  gender?: string | null
  roles?: RoleInfo[]
  permissions?: string[]
}

export interface AccountListFilters {
  q?: string
  page?: number
  limit?: number
}

export interface UpsertAccountPayload {
  id?: string
  email: string
  name?: string
  phoneNumber?: string
  birthday?: string
  gender?: string
  photoUrl?: string
  roles: AppRole[]
}
