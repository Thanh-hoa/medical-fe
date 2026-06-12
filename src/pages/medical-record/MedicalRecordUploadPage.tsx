import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Alert, App, Button, Upload } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { FileCheck2, ScanLine, Send } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import { medicalRecordApi } from '../../api/medicalRecord.api'

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

export default function MedicalRecordUploadPage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const uploadMutation = useMutation({
    mutationFn: (selectedFile: File) => medicalRecordApi.upload(selectedFile),
    onSuccess: (response) => {
      message.success('Upload và xử lý OCR thành công')
      navigate(`/medical-records/${response.data.data.id}`)
    },
    onError: (error: any) => {
      message.error(error?.response?.data?.message ?? 'Upload thất bại')
    },
  })

  const preview = useMemo(() => previewUrl, [previewUrl])

  const beforeUpload = (nextFile: File) => {
    if (!allowedTypes.includes(nextFile.type)) {
      message.error('Chỉ chấp nhận JPG, JPEG, PNG hoặc WEBP')
      return Upload.LIST_IGNORE
    }

    if (nextFile.size > 5 * 1024 * 1024) {
      message.error('File không được vượt quá 5MB')
      return Upload.LIST_IGNORE
    }

    setFile(nextFile)
    setPreviewUrl(URL.createObjectURL(nextFile))
    return false
  }

  return (
    <PageShell
      title="Upload bệnh án"
      description="Backend xử lý OCR đồng bộ trong một transaction và trả về hồ sơ ở trạng thái EXTRACTED để nhân viên kiểm tra."
    >
      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 p-6">
            <div className="flex items-center gap-4">
              <div className="grid size-12 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200">
                <ScanLine size={22} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Bước 1</p>
                <h2 className="text-xl font-semibold text-slate-950">Tải ảnh y tế lên OCR</h2>
              </div>
            </div>
          </div>

          <div className="p-6">
            <Upload.Dragger
              accept=".jpg,.jpeg,.png,.webp"
              beforeUpload={beforeUpload}
              maxCount={1}
              showUploadList
              className="!rounded-[24px] !border-2 !border-dashed !border-slate-300 !bg-slate-50 !p-8 transition hover:!border-indigo-400 hover:!bg-indigo-50/60"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined className="!text-5xl !text-slate-400" />
              </p>
              <p className="text-lg font-medium text-slate-700">Kéo thả file vào đây</p>
              <p className="mt-2 text-sm text-slate-400">hoặc click để chọn file từ máy</p>
              <p className="mt-3 text-xs text-slate-400">JPG, JPEG, PNG, WEBP - tối đa 5MB</p>
            </Upload.Dragger>

            <Button
              type="primary"
              size="large"
              icon={uploadMutation.isPending ? <ScanLine size={18} /> : <Send size={18} />}
              className="mt-5 h-12 rounded-2xl px-6"
              disabled={!file}
              loading={uploadMutation.isPending}
              onClick={() => file && uploadMutation.mutate(file)}
            >
              {uploadMutation.isPending ? 'Đang OCR đồng bộ...' : 'Upload và xử lý OCR'}
            </Button>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <FileCheck2 className="text-emerald-500" size={22} />
            <h2 className="text-lg font-semibold text-slate-900">Xem trước</h2>
          </div>
          <div className="mt-5 flex min-h-96 items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-4">
            {preview ? (
              <img src={preview} alt="preview" className="max-h-[28rem] w-full rounded-2xl object-contain" />
            ) : (
              <p className="text-sm text-slate-400">Chọn một ảnh để xem trước trước khi gửi OCR.</p>
            )}
          </div>
          <Alert
            type="info"
            showIcon
            className="mt-5"
            message="Luồng sau upload"
            description="Hồ sơ trả về trạng thái EXTRACTED. Nhân viên kiểm tra dữ liệu, cập nhật nếu cần, rồi bấm Gửi duyệt."
          />
        </section>
      </div>
    </PageShell>
  )
}
