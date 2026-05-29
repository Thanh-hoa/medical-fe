export interface JsonResponse<T> {
  isError: boolean
  message: string
  data: T
}

export interface PagedResponse<T> {
  items: T[]
  page: number
  limit: number
  totalItems: number
  totalPages: number
}
