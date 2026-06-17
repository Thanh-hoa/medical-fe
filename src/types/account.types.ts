export interface RoleInfo {
  id: number
  name: string
}

export interface AccountInfo {
  id: number | string
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
}

export interface AccountListFilters {
  q?: string
  page?: number
  limit?: number
  sort_by?: string
  order_by?: 'asc' | 'desc'
}

export interface UpsertAccountPayload {
  id?: number | string
  email: string
  name: string
  phone_number: string
  birthday?: string | null
  gender?: string
  photo?: string | null
  roles?: number[]
  is_active?: boolean
}

export interface UpdateProfilePayload {
  name: string
  phone_number: string
  birthday?: string | null
  email: string
  gender?: string
  photo?: string | null
}

export interface ChangePasswordPayload {
  current_password: string
  new_password: string
  repeat_new_password: string
}

export interface RegisterAccountPayload {
  email: string
  password: string
  repeatPassword: string
}
