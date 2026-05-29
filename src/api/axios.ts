import axios from 'axios'
import { API_BASE_URL } from '../config/env'
import { useAuthStore } from '../store/auth.store'
import type { AuthTokens } from '../types/auth.types'
import type { JsonResponse } from '../types/common.types'

const refreshClient = axios.create({
  baseURL: API_BASE_URL,
})

export const publicClient = axios.create({
  baseURL: API_BASE_URL,
})

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

let refreshPromise: Promise<string | null> | null = null

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as { _retry?: boolean } & typeof error.config
    const authStore = useAuthStore.getState()

    if (error.response?.status !== 401 || originalRequest?._retry || !authStore.refreshToken) {
      return Promise.reject(error)
    }

    originalRequest._retry = true

    if (!refreshPromise) {
      refreshPromise = refreshClient
        .post<JsonResponse<AuthTokens>>('/auth/refresh-token', {
          refreshToken: authStore.refreshToken,
        })
        .then((response) => {
          const data = response.data.data
          useAuthStore.getState().setAuth(data.token, data.refreshToken)
          return data.token
        })
        .catch(() => {
          useAuthStore.getState().logout()
          return null
        })
        .finally(() => {
          refreshPromise = null
        })
    }

    const nextToken = await refreshPromise

    if (!nextToken) {
      return Promise.reject(error)
    }

    originalRequest.headers = originalRequest.headers ?? {}
    originalRequest.headers.Authorization = `Bearer ${nextToken}`
    return apiClient(originalRequest)
  },
)
