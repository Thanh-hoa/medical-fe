import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Alert, App, Button, Upload } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import PageShell from '../../components/PageShell'
import { medicalRecordApi } from '../../api/medicalRecord.api'

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
    const allowed = ['image/jpeg', 'image/png', 'application/pdf']

    if (!allowed.includes(nextFile.type)) {
      message.error('Chỉ chấp nhận JPG, PNG hoặc PDF')
      return Upload.LIST_IGNORE
    }

    if (nextFile.size > 5 * 1024 * 1024) {
      message.error('File không được vượt quá 5MB')
      return Upload.LIST_IGNORE
    }

    setFile(nextFile)
    setPreviewUrl(nextFile.type.startsWith('image/') ? URL.createObjectURL(nextFile) : null)
    return false
  }

  return (
    <PageShell
      title="Upload bệnh án"
      description="Tải ảnh hoặc PDF lên để backend xử lý OCR và trả về `extractedData` cùng `labData`."
    >
      <Alert
        type="info"
        showIcon
        className="rounded-3xl"
        message="Flow upload"
        description="Sau khi upload, backend sẽ tạo hồ sơ ở trạng thái Processing hoặc Extracted tùy tiến độ OCR."
      />

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <Upload.Dragger
            accept=".jpg,.jpeg,.png,.pdf"
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
            <p className="mt-3 text-xs text-slate-400">JPG, PNG, PDF • tối đa 5MB</p>
          </Upload.Dragger>

          <Button
            type="primary"
            size="large"
            className="mt-5 h-12 rounded-2xl px-6"
            disabled={!file}
            loading={uploadMutation.isPending}
            onClick={() => file && uploadMutation.mutate(file)}
          >
            {uploadMutation.isPending ? 'Đang xử lý OCR...' : 'Upload và xử lý OCR'}
          </Button>
        </section>

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Preview</h2>
          <div className="mt-5 flex min-h-96 items-center justify-center rounded-[24px] border border-dashed border-slate-200 bg-slate-50 p-4">
            {preview ? (
              <img src={preview} alt="preview" className="max-h-[28rem] w-full rounded-2xl object-contain" />
            ) : (
              <p className="text-sm text-slate-400">Chưa có preview. PDF vẫn upload được nhưng không render thumbnail ở đây.</p>
            )}
          </div>
        </section>
      </div>
    </PageShell>
  )
}
