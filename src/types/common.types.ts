export interface JsonResponse<T> {
  isError: boolean
  message: string
  data: T
}

export interface PagedResponse<T> {
  items: T[]
  currentPage: number
  page?: number
  limit: number
  totalItems: number
  totalPage: number
  totalPages?: number
}

export interface UploadMediaResponse {
  path: string
  fileName: string
  extensionFile: string
}
