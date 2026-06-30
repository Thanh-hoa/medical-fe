import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { App, Button, Empty, Input, Space, Table } from 'antd'
import { CalendarDays, Edit3, FileSearch, Plus, Search, ShieldPlus, UsersRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { patientApi } from '../../api/patient.api'
import PageShell from '../../components/PageShell'
import { usePermission } from '../../hooks/usePermission'
import type { Patient, UpsertPatientPayload } from '../../types/patient.types'
import PatientFormModal from './PatientFormModal'

function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleDateString('vi-VN') : '-'
}

function getApiMessage(error: unknown, fallback: string) {
  const apiError = error as { response?: { data?: { message?: string } } }
  return apiError.response?.data?.message ?? fallback
}

function getPatientIdentifier(patient: Patient) {
  return patient.bhyt || patient.citizenId || ''
}

export default function PatientListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { message } = App.useApp()
  const canCreate = usePermission('patient-search:create')
  const canEdit = usePermission('patient-search:edit')
  const [filters, setFilters] = useState({ q: '', page: 1, limit: 10 })
  const [draftSearch, setDraftSearch] = useState('')
  const [modalState, setModalState] = useState<{ mode: 'create' | 'edit'; patient?: Patient | null } | null>(null)

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['patients', filters],
    queryFn: () => patientApi.list(filters).then((response) => response.data.data),
  })

  const visibleStats = useMemo(() => {
    const items = data?.items ?? []
    return {
      total: data?.totalItems ?? 0,
      pageCount: items.length,
      withPhone: items.filter((item) => Boolean(item.phone)).length,
    }
  }, [data])

  const createMutation = useMutation({
    mutationFn: (payload: UpsertPatientPayload) => patientApi.create(payload),
    onSuccess: async (response) => {
      message.success(response.data.message || 'Tạo bệnh nhân thành công')
      setModalState(null)
      await queryClient.invalidateQueries({ queryKey: ['patients'] })
    },
    onError: (error) => message.error(getApiMessage(error, 'Tạo bệnh nhân thất bại')),
  })

  const updateMutation = useMutation({
    mutationFn: ({ patient, payload }: { patient: Patient; payload: UpsertPatientPayload }) =>
      patientApi.update(patient.id, { id: patient.id, ...payload }),
    onSuccess: async (response) => {
      message.success(response.data.message || 'Cập nhật bệnh nhân thành công')
      setModalState(null)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['patients'] }),
        queryClient.invalidateQueries({ queryKey: ['patient-search'] }),
      ])
    },
    onError: (error) => message.error(getApiMessage(error, 'Cập nhật bệnh nhân thất bại')),
  })

  const submitSearch = (q = draftSearch) => {
    setFilters((prev) => ({ ...prev, q: q.trim(), page: 1 }))
  }

  const handleSubmitPatient = (payload: UpsertPatientPayload) => {
    if (modalState?.mode === 'edit' && modalState.patient) {
      updateMutation.mutate({ patient: modalState.patient, payload })
      return
    }

    createMutation.mutate(payload)
  }

  return (
    <PageShell
      title="Quản lý bệnh nhân"
      description="Tìm kiếm, tạo mới và cập nhật hồ sơ bệnh nhân theo tên, số BHYT hoặc CCCD."
      actions={
        canCreate ? (
          <Button type="primary" size="large" icon={<Plus size={18} />} onClick={() => setModalState({ mode: 'create' })}>
            Tạo bệnh nhân
          </Button>
        ) : null
      }
    >
      <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
        <div className="border-b border-slate-100 bg-white p-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-4 rounded-3xl border border-[#E5EAF1] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
              <div className="grid size-12 place-items-center rounded-2xl bg-[#2563EB] text-white">
                <UsersRound size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Tổng hồ sơ</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{visibleStats.total}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-3xl border border-[#E5EAF1] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
              <div className="grid size-12 place-items-center rounded-2xl bg-emerald-500 text-white">
                <ShieldPlus size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Trang hiện tại</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{visibleStats.pageCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-3xl border border-[#E5EAF1] bg-white p-4 shadow-[0_1px_2px_rgba(15,23,41,0.04)]">
              <div className="grid size-12 place-items-center rounded-2xl bg-sky-500 text-white">
                <CalendarDays size={22} />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Có liên hệ</p>
                <p className="mt-1 text-2xl font-semibold text-slate-950">{visibleStats.withPhone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-5">
          <Space wrap className="mb-5">
            <Input
              allowClear
              prefix={<Search size={16} className="text-slate-400" />}
              placeholder="Tìm theo tên, số BHYT hoặc CCCD"
              value={draftSearch}
              onChange={(event) => setDraftSearch(event.target.value)}
              onPressEnter={() => submitSearch()}
              className="min-w-80"
            />
            <Button loading={isFetching} icon={<Search size={16} />} onClick={() => submitSearch()}>
              Tìm kiếm
            </Button>
            {filters.q ? (
              <Button
                onClick={() => {
                  setDraftSearch('')
                  submitSearch('')
                }}
              >
                Xóa lọc
              </Button>
            ) : null}
          </Space>

          <Table<Patient>
            rowKey="id"
            loading={isLoading}
            dataSource={data?.items ?? []}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={filters.q ? 'Không tìm thấy bệnh nhân phù hợp.' : 'Chưa có bệnh nhân trong hệ thống.'}
                />
              ),
            }}
            pagination={{
              current: filters.page,
              pageSize: filters.limit,
              total: data?.totalItems ?? 0,
              showSizeChanger: true,
              onChange: (page, pageSize) => setFilters((prev) => ({ ...prev, page, limit: pageSize })),
            }}
            columns={[
              {
                title: 'Bệnh nhân',
                dataIndex: 'name',
                width: 210,
                render: (value: string, item) => (
                  <div className="min-w-[170px] text-left">
                    <button
                      type="button"
                      className="block max-w-[180px] whitespace-normal break-words text-left font-semibold leading-6 text-slate-950 transition hover:text-[#2563EB]"
                      onClick={() => {
                        const identifier = getPatientIdentifier(item)
                        if (identifier) navigate(`/patients/detail?identifier=${encodeURIComponent(identifier)}`)
                      }}
                    >
                      {value}
                    </button>
                    <p className="mt-1 text-xs text-slate-400">ID #{item.id}</p>
                  </div>
                ),
              },
              {
                title: 'BHYT',
                dataIndex: 'bhyt',
                render: (value: string | null) => value ?? '-',
              },
              {
                title: 'CCCD',
                dataIndex: 'citizenId',
                render: (value: string | null) => value ?? '-',
              },
              { title: 'Ngày sinh', dataIndex: 'dob', render: formatDate },
              { title: 'Giới tính', dataIndex: 'gender', render: (value: string | null) => value ?? '-' },
              { title: 'SĐT', dataIndex: 'phone', render: (value: string | null) => value ?? '-' },
              {
                title: 'Địa chỉ',
                dataIndex: 'address',
                ellipsis: true,
                render: (value: string | null) => value ?? '-',
              },
              {
                title: 'Thao tác',
                width: 160,
                render: (_, item) => (
                  <Space direction="vertical" size={8}>
                    <Button
                      className="w-32 justify-center"
                      icon={<FileSearch size={15} />}
                      disabled={!getPatientIdentifier(item)}
                      onClick={() => {
                        const identifier = getPatientIdentifier(item)
                        if (identifier) navigate(`/patients/detail?identifier=${encodeURIComponent(identifier)}`)
                      }}
                    >
                      Chi tiết
                    </Button>
                    {canEdit ? (
                      <Button className="w-32 justify-center" icon={<Edit3 size={15} />} onClick={() => setModalState({ mode: 'edit', patient: item })}>
                        Sửa
                      </Button>
                    ) : null}
                  </Space>
                ),
              },
            ]}
          />
        </div>
      </section>

      <PatientFormModal
        open={Boolean(modalState)}
        mode={modalState?.mode ?? 'create'}
        patient={modalState?.patient}
        loading={createMutation.isPending || updateMutation.isPending}
        onCancel={() => setModalState(null)}
        onSubmit={handleSubmitPatient}
      />
    </PageShell>
  )
}
