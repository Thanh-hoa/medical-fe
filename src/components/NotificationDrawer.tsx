import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Drawer, Skeleton, Tooltip } from 'antd'
import {
  Bell,
  CheckCircle2,
  CheckCheck,
  FileUp,
  RefreshCw,
  RotateCcw,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { notificationApi } from '../api/notification.api'
import type { Notification, NotificationType } from '../types/notification.types'
import { cn } from '../lib/cn'

const TYPE_META: Record<
  NotificationType,
  { icon: typeof Bell; accent: string; ring: string; iconClass: string }
> = {
  UPLOAD: {
    icon: FileUp,
    accent: 'border-l-sky-400',
    ring: 'ring-sky-200 bg-sky-50',
    iconClass: 'text-sky-500',
  },
  SUBMIT: {
    icon: Send,
    accent: 'border-l-amber-400',
    ring: 'ring-amber-200 bg-amber-50',
    iconClass: 'text-amber-500',
  },
  APPROVE: {
    icon: CheckCircle2,
    accent: 'border-l-emerald-400',
    ring: 'ring-emerald-200 bg-emerald-50',
    iconClass: 'text-emerald-500',
  },
  REJECT: {
    icon: XCircle,
    accent: 'border-l-rose-400',
    ring: 'ring-rose-200 bg-rose-50',
    iconClass: 'text-rose-500',
  },
  RESUBMIT: {
    icon: RotateCcw,
    accent: 'border-l-violet-400',
    ring: 'ring-violet-200 bg-violet-50',
    iconClass: 'text-violet-500',
  },
  UPDATE: {
    icon: RefreshCw,
    accent: 'border-l-indigo-400',
    ring: 'ring-indigo-200 bg-indigo-50',
    iconClass: 'text-indigo-500',
  },
  DELETE: {
    icon: Trash2,
    accent: 'border-l-slate-400',
    ring: 'ring-slate-200 bg-slate-50',
    iconClass: 'text-slate-400',
  },
}

function getTypeMeta(type: string) {
  return TYPE_META[type as NotificationType] ?? TYPE_META.UPDATE
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  return `${d} ngày trước`
}

function NotificationItem({
  item,
  onMarkRead,
  onDelete,
}: {
  item: Notification
  onMarkRead: (id: number) => void
  onDelete: (id: number) => void
}) {
  const meta = getTypeMeta(item.type)
  const Icon = meta.icon

  return (
    <div
      className={cn(
        'group relative flex gap-3 border-l-[3px] p-4 transition-colors hover:bg-slate-50',
        meta.accent,
        !item.isRead && 'bg-slate-50/70',
      )}
    >
      <div className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-xl ring-1', meta.ring)}>
        <Icon size={15} className={meta.iconClass} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              'text-sm leading-snug text-slate-800',
              !item.isRead && 'font-semibold',
            )}
          >
            {item.title}
          </p>
          {!item.isRead && (
            <span className="mt-1 size-1.5 shrink-0 rounded-full bg-indigo-500" />
          )}
        </div>
        <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{item.message}</p>
        <div className="mt-2 flex items-center gap-3">
          <span className="text-[11px] text-slate-400">{timeAgo(item.createdAt)}</span>
          {item.resourceId && (
            <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
              {item.resourceType}:{item.resourceId}
            </span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        {!item.isRead && (
          <Tooltip title="Đánh dấu đã đọc">
            <button
              onClick={(event) => {
                event.stopPropagation()
                onMarkRead(item.id)
              }}
              className="grid size-7 place-items-center rounded-xl text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
            >
              <CheckCheck size={13} />
            </button>
          </Tooltip>
        )}
        <Tooltip title="Xóa">
          <button
            onClick={(event) => {
              event.stopPropagation()
              onDelete(item.id)
            }}
            className="grid size-7 place-items-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Trash2 size={13} />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}

export default function NotificationDrawer() {
  const [open, setOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { data: unreadData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationApi.unreadCount().then((r) => r.data.unreadCount),
    refetchInterval: 10_000,
  })

  const { data, status, isFetching, refetch } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationApi.list({ page: 1, limit: 20 }).then((r) => r.data),
    enabled: open,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchInterval: open ? 10_000 : false,
  })

  const markReadMutation = useMutation({
    mutationFn: (id: number) => notificationApi.markRead(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => notificationApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const unreadCount = unreadData ?? 0
  const items = (data?.items ?? []).filter((item) => !item.isRead)
  const hasUnread = items.some((n) => !n.isRead)

  const handleItemClick = (item: Notification) => {
    if (!item.isRead) {
      markReadMutation.mutate(item.id)
    }
    const resourceType = item.resourceType.toLowerCase().replaceAll('_', '')
    if ((resourceType === 'medicalrecord' || resourceType === 'medicalrecords') && item.resourceId) {
      navigate(`/medical-records/${item.resourceId}`)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
        }}
        className="relative grid size-10 place-items-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid min-w-[18px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        closable={false}
        styles={{ body: { padding: 0 }, wrapper: { width: 420 } }}
        title={null}
      >
        {/* drawer header */}
        <div className="relative overflow-hidden bg-slate-950 px-6 py-5">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-2xl bg-white/10">
                <Bell size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Thông báo</p>
                <p className="text-sm font-semibold text-white">
                  {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Tất cả đã đọc'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasUnread && (
                <Button
                  size="small"
                  icon={<CheckCheck size={13} />}
                  loading={markAllMutation.isPending}
                  onClick={() => markAllMutation.mutate()}
                  className="!border-white/20 !bg-white/10 !text-white hover:!bg-white/20"
                >
                  Đọc tất cả
                </Button>
              )}
              <button
                onClick={() => void refetch()}
                className="grid size-8 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
                title="Tai lai thong bao"
              >
                <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="grid size-8 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* notification list */}
        <div className="flex-1 overflow-y-auto">
          {/* fetching indicator */}
          {isFetching && status === 'success' && (
            <div className="flex items-center justify-center gap-2 bg-indigo-50 px-4 py-2 text-xs text-indigo-600">
              <RefreshCw size={11} className="animate-spin" />
              Đang cập nhật...
            </div>
          )}

          {status === 'pending' ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton active avatar={{ size: 32, shape: 'square' }} paragraph={{ rows: 2 }} title={false} />
                </div>
              ))}
            </div>
          ) : status === 'error' ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-3xl bg-rose-50">
                <Bell size={22} className="text-rose-400" />
              </div>
              <p className="text-sm font-medium text-slate-600">Không thể tải thông báo</p>
              <p className="text-xs text-slate-400">Kiểm tra kết nối và thử lại</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="grid size-14 place-items-center rounded-3xl bg-slate-100">
                <Bell size={22} className="text-slate-400" />
              </div>
              <p className="text-sm font-medium text-slate-500">Chưa có thông báo</p>
              <p className="text-xs text-slate-400">Các sự kiện mới sẽ xuất hiện ở đây</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} onClick={() => handleItemClick(item)} className="cursor-pointer">
                  <NotificationItem
                    item={item}
                    onMarkRead={(id) => markReadMutation.mutate(id)}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-slate-100 p-4">
            <p className="text-center text-xs text-slate-400">
              Hiển thị {items.length} / {data?.totalItems ?? 0} thông báo
            </p>
          </div>
        )}
      </Drawer>
    </>
  )
}
