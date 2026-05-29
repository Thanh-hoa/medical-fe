import { Link } from 'react-router-dom'
import { Button } from 'antd'
import PageShell from '../../components/PageShell'

export default function MedicalRecordApprovalPage() {
  return (
    <PageShell
      title="Medical Records Approval"
      description="Danh sach benh an cho phe duyet se duoc hien thi tai day khi backend cung cap API rieng cho hang doi phe duyet."
      actions={
        <Link to="/medical-records">
          <Button type="primary">Mo danh sach benh an</Button>
        </Link>
      }
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        Hien tai thao tac approve dang nam trong trang chi tiet benh an.
      </div>
    </PageShell>
  )
}
