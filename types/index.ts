export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export type Role = 'ADMIN' | 'GURU' | 'SISWA'

export type JK = 'L' | 'P'

export type PPDBStatus = 'pending' | 'diterima' | 'ditolak'

export type BlogStatus = 'draft' | 'publish'
