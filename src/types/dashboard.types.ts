export interface DashboardOverview {
  totalRecords: number
  totalPatients: number
  totalAccounts: number
  processingRecords: number
  extractedRecords: number
  pendingReviewRecords: number
  approvedRecords: number
  rejectedRecords: number
  todayUploads: number
  todayApprovals: number
}

export interface DashboardCountItem {
  label: string
  count: number
}

export interface UserPerformance {
  accountId: number
  accountName: string
  uploaded: number
  approved: number
  rejected: number
}
