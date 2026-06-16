import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Form, Input, Modal, Popconfirm, Select, Skeleton, Switch, Tag, Tooltip, message } from 'antd'
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Edit3,
  Globe,
  KeyRound,
  Plus,
  ShieldCheck,
  Trash2,
  Webhook,
  XCircle,
  Zap,
} from 'lucide-react'
import PageShell from '../../components/PageShell'
import { webhookApi } from '../../api/webhook.api'
import type { Webhook as WebhookType, WebhookPayload } from '../../types/webhook.types'
import { cn } from '../../lib/cn'

const EVENT_OPTIONS = [
  { value: 'UPLOAD', label: 'UPLOAD' },
  { value: 'SUBMIT', label: 'SUBMIT' },
  { value: 'APPROVE', label: 'APPROVE' },
  { value: 'REJECT', label: 'REJECT' },
  { value: 'RESUBMIT', label: 'RESUBMIT' },
  { value: 'DELETE', label: 'DELETE' },
]

const EVENT_COLORS: Record<string, string> = {
  UPLOAD: 'blue',
  SUBMIT: 'gold',
  APPROVE: 'green',
  REJECT: 'red',
  RESUBMIT: 'purple',
  DELETE: 'default',
}

function parseEventTypes(str: string): string[] {
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function WebhookCard({
  webhook,
  onEdit,
  onDelete,
  onToggle,
  toggling,
}: {
  webhook: WebhookType
  onEdit: (w: WebhookType) => void
  onDelete: (id: number) => void
  onToggle: (id: number, active: boolean) => void
  toggling: boolean
}) {
  const events = parseEventTypes(webhook.eventTypes)

  return (
    <article className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* status stripe */}
      <div
        className={cn(
          'absolute inset-x-0 top-0 h-1 transition-colors',
          webhook.isActive ? 'bg-emerald-400' : 'bg-slate-300',
        )}
      />

      <div className="p-6 pt-7">
        {/* URL row */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl',
              webhook.isActive ? 'bg-emerald-50' : 'bg-slate-100',
            )}
          >
            <Globe size={18} className={webhook.isActive ? 'text-emerald-600' : 'text-slate-400'} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold',
                  webhook.isActive
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
                )}
              >
                {webhook.isActive ? <CheckCircle2 size={10} /> : <XCircle size={10} />}
                {webhook.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <Tooltip title={webhook.url}>
              <p className="mt-1.5 truncate font-mono text-sm font-medium text-slate-800">{webhook.url}</p>
            </Tooltip>
          </div>
        </div>

        {/* event types */}
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">Sự kiện</p>
          <div className="flex flex-wrap gap-1.5">
            {events.map((ev) => (
              <Tag key={ev} color={EVENT_COLORS[ev] ?? 'default'} className="rounded-lg text-xs">
                {ev}
              </Tag>
            ))}
          </div>
        </div>

        {/* timestamps */}
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-500">
          <div>
            <p className="font-semibold text-slate-400">Tạo lúc</p>
            <p className="mt-0.5">{new Date(webhook.createdAt).toLocaleString('vi-VN')}</p>
          </div>
          {webhook.updatedAt ? (
            <div>
              <p className="font-semibold text-slate-400">Cập nhật</p>
              <p className="mt-0.5">{new Date(webhook.updatedAt).toLocaleString('vi-VN')}</p>
            </div>
          ) : (
            <div>
              <p className="font-semibold text-slate-400">Cập nhật</p>
              <p className="mt-0.5 text-slate-300">—</p>
            </div>
          )}
        </div>

        {/* actions */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2">
            <Switch
              size="small"
              checked={webhook.isActive}
              loading={toggling}
              onChange={(checked) => onToggle(webhook.id, checked)}
            />
            <span className="text-xs text-slate-500">{webhook.isActive ? 'Bật' : 'Tắt'}</span>
          </div>
          <div className="flex gap-2">
            <Button
              size="small"
              icon={<Edit3 size={13} />}
              onClick={() => onEdit(webhook)}
            >
              Sửa
            </Button>
            <Popconfirm
              title="Xóa webhook?"
              description="Hành động này không thể hoàn tác."
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
              onConfirm={() => onDelete(webhook.id)}
            >
              <Button size="small" danger icon={<Trash2 size={13} />}>
                Xóa
              </Button>
            </Popconfirm>
          </div>
        </div>
      </div>
    </article>
  )
}

type FormValues = {
  url: string
  eventTypes: string[]
  secret: string
  isActive: boolean
}

function WebhookFormModal({
  open,
  editing,
  onClose,
}: {
  open: boolean
  editing: WebhookType | null
  onClose: () => void
}) {
  const [form] = Form.useForm<FormValues>()
  const queryClient = useQueryClient()
  const [msg, msgCtx] = message.useMessage()

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: Partial<WebhookPayload> = {
        url: values.url,
        eventTypes: values.eventTypes.join(','),
        isActive: values.isActive,
      }

      if (!editing || values.secret?.trim()) {
        payload.secret = values.secret.trim()
      }

      return editing
        ? webhookApi.update(editing.id, payload)
        : webhookApi.create(payload as WebhookPayload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      void msg.success(editing ? 'Cập nhật webhook thành công' : 'Tạo webhook thành công')
      onClose()
    },
    onError: () => {
      void msg.error('Thao tác thất bại, vui lòng thử lại')
    },
  })

  const handleOpen = () => {
    if (editing) {
      form.setFieldsValue({
        url: editing.url,
        eventTypes: parseEventTypes(editing.eventTypes),
        secret: '',
        isActive: editing.isActive,
      })
    } else {
      form.resetFields()
      form.setFieldValue('isActive', true)
    }
  }

  return (
    <>
      {msgCtx}
      <Modal
        open={open}
        title={null}
        footer={null}
        onCancel={onClose}
        afterOpenChange={(o) => o && handleOpen()}
        width={540}
        className="[&_.ant-modal-content]:!rounded-3xl [&_.ant-modal-content]:!p-0"
      >
        <div className="relative overflow-hidden rounded-t-3xl bg-slate-950 px-7 py-6">
          <div className="absolute -right-8 -top-8 size-32 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative flex items-center gap-4">
            <div className="grid size-11 place-items-center rounded-2xl bg-white/10">
              <Webhook size={20} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                {editing ? 'Chỉnh sửa' : 'Tạo mới'}
              </p>
              <h2 className="text-lg font-bold text-white">Webhook Configuration</h2>
            </div>
          </div>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => mutation.mutate(values)}
          className="p-7"
        >
          <Form.Item
            name="url"
            label="Webhook URL"
            rules={[{ required: true, message: 'Nhập URL' }, { type: 'url', message: 'URL không hợp lệ' }]}
          >
            <Input
              prefix={<Globe size={14} className="text-slate-400" />}
              placeholder="https://your-service.com/webhooks"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="eventTypes"
            label="Loại sự kiện"
            rules={[{ required: true, message: 'Chọn ít nhất 1 sự kiện' }]}
          >
            <Select
              mode="multiple"
              size="large"
              options={EVENT_OPTIONS}
              placeholder="Chọn sự kiện cần lắng nghe"
            />
          </Form.Item>

          <Form.Item
            name="secret"
            label={
              <span className="flex items-center gap-1.5">
                <KeyRound size={13} />
                Secret Key {editing && <span className="text-slate-400">(để trống nếu không đổi)</span>}
              </span>
            }
            rules={editing ? [] : [{ required: true, message: 'Nhập secret key' }]}
          >
            <Input.Password
              placeholder="HMAC-SHA256 secret"
              size="large"
            />
          </Form.Item>

          <Form.Item name="isActive" label="Trạng thái" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <div className="flex justify-end gap-3">
            <Button onClick={onClose}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
              icon={<Zap size={14} />}
            >
              {editing ? 'Lưu thay đổi' : 'Tạo Webhook'}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  )
}

export default function WebhookPage() {
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<WebhookType | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const [msg, msgCtx] = message.useMessage()

  const { data: webhooks = [], isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => webhookApi.list().then((r) => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => webhookApi.remove(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['webhooks'] })
      void msg.success('Đã xóa webhook')
    },
  })

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      webhookApi.update(id, { isActive }),
    onMutate: ({ id }) => setTogglingId(id),
    onSettled: () => setTogglingId(null),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['webhooks'] })
    },
  })

  const activeCount = webhooks.filter((w) => w.isActive).length
  const totalEvents = [
    ...new Set(
      webhooks.flatMap((w) => parseEventTypes(w.eventTypes)),
    ),
  ].length

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (w: WebhookType) => {
    setEditing(w)
    setFormOpen(true)
  }

  return (
    <PageShell
      title="Quản lý Webhook"
      description="Cấu hình HTTP callbacks khi có sự kiện bệnh án. Hệ thống tự động POST payload kèm chữ ký HMAC-SHA256."
      actions={
        <Button
          type="primary"
          icon={<Plus size={16} />}
          onClick={openCreate}
        >
          Thêm Webhook
        </Button>
      }
    >
      {msgCtx}

      {/* stats banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.7)]">
        <div className="absolute -right-16 -top-16 size-64 rounded-full bg-violet-600/15 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 size-48 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative grid gap-6 sm:grid-cols-3">
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-white/10">
              <Webhook size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-400">Tổng webhook</p>
              <p className="text-3xl font-bold">{webhooks.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500/20">
              <Activity size={22} className="text-emerald-300" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Đang hoạt động</p>
              <p className="text-3xl font-bold text-emerald-300">{activeCount}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-violet-500/20">
              <ShieldCheck size={22} className="text-violet-300" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Event types theo dõi</p>
              <p className="text-3xl font-bold text-violet-300">{totalEvents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* security notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
        <AlertTriangle size={17} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-sm text-amber-700">
          Mỗi request webhook đều được ký bằng{' '}
          <span className="font-semibold">HMAC-SHA256</span> qua header{' '}
          <code className="rounded bg-amber-100 px-1 font-mono text-xs">X-Webhook-Signature</code>.
          Luôn xác minh chữ ký trước khi xử lý payload.
        </p>
      </div>

      {/* webhook grid */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-slate-200 bg-white p-6">
              <Skeleton active paragraph={{ rows: 4 }} />
            </div>
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-slate-200 bg-white py-20 text-center">
          <div className="grid size-16 place-items-center rounded-3xl bg-slate-100">
            <Webhook size={26} className="text-slate-400" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-700">Chưa có webhook nào</p>
            <p className="mt-1 text-sm text-slate-400">Tạo webhook đầu tiên để nhận sự kiện từ hệ thống</p>
          </div>
          <Button type="primary" icon={<Plus size={15} />} onClick={openCreate}>
            Thêm Webhook
          </Button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {webhooks.map((w) => (
            <WebhookCard
              key={w.id}
              webhook={w}
              onEdit={openEdit}
              onDelete={(id) => deleteMutation.mutate(id)}
              onToggle={(id, isActive) => toggleMutation.mutate({ id, isActive })}
              toggling={togglingId === w.id}
            />
          ))}
        </div>
      )}

      <WebhookFormModal
        open={formOpen}
        editing={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
      />
    </PageShell>
  )
}
