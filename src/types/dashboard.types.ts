export interface DashboardOverview {
  range?: DashboardRange
  cards?: DashboardOverviewCard[]
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
  key?: string
  label: string
  count: number
  percent?: number
}

export interface UserPerformance {
  accountId: number
  accountName: string
  uploaded: number
  approved: number
  rejected: number
  totalActions?: number
}

export type DashboardPeriod = 'day' | 'week' | 'month' | 'year'

export type DashboardMetric = 'uploads' | 'records' | 'approvals' | 'rejections'

export type DashboardStatusScope = 'created' | 'current'

export interface DashboardTimeParams {
  period?: DashboardPeriod
  date?: string
  fromDate?: string
  toDate?: string
}

export interface DashboardRange {
  period: DashboardPeriod
  fromDate: string
  toDate: string
  previousFromDate: string
  previousToDate: string
}

export interface DashboardOverviewCard {
  key: string
  label: string
  value: number
  previousValue: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'flat'
}

export interface DashboardTimelineParams extends DashboardTimeParams {
  metric: DashboardMetric
}

export interface DashboardTimelineItem {
  key: string
  label: string
  count: number
  percent: number
}

export interface DashboardTimeline {
  metric: DashboardMetric
  period?: DashboardPeriod
  fromDate: string
  toDate: string
  items: DashboardTimelineItem[]
}

export interface DashboardStatusParams extends DashboardTimeParams {
  scope?: DashboardStatusScope
}
