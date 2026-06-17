import type { AxiosResponse } from 'axios'
import { apiClient, publicClient } from './axios'
import type {
  AuthTokens,
  ForgotPasswordPayload,
  LoginPayload,
  RefreshTokenPayload,
  ResetPasswordPayload,
} from '../types/auth.types'
import type { JsonResponse } from '../types/common.types'

export const authApi = {
  login(payload: LoginPayload): Promise<AxiosResponse<JsonResponse<AuthTokens>>> {
    return publicClient.post('/auth/login', payload)
  },
  logout(token: string): Promise<AxiosResponse<JsonResponse<null>>> {
    return apiClient.post('/auth/logout', token, {
      headers: { 'Content-Type': 'text/plain' },
    })
  },
  refreshToken(payload: RefreshTokenPayload): Promise<AxiosResponse<JsonResponse<AuthTokens>>> {
    return publicClient.post('/auth/refresh-token', payload)
  },
  forgotPassword(payload: ForgotPasswordPayload): Promise<AxiosResponse<Omit<JsonResponse<never>, 'data'>>> {
    return publicClient.post('/auth/forgot-password', payload)
  },
  resetPassword(payload: ResetPasswordPayload): Promise<AxiosResponse<Omit<JsonResponse<never>, 'data'>>> {
    return publicClient.post('/auth/reset-password', payload)
  },
}
