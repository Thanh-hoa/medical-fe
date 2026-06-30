import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import DefaultRedirect from './DefaultRedirect'
import PermissionRoute from './PermissionRoute'
import PrivateRoute from './PrivateRoute'

const AccountListPage = lazy(() => import('../pages/account/AccountListPage'))
const AuditLogPage = lazy(() => import('../pages/audit-log/AuditLogPage'))
const ProfilePage = lazy(() => import('../pages/account/ProfilePage'))
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'))
const ValidateTokenPage = lazy(() => import('../pages/auth/ValidateTokenPage'))
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))
const MedicalRecordApprovalPage = lazy(() => import('../pages/medical-record/MedicalRecordApprovalPage'))
const MedicalRecordDetailPage = lazy(() => import('../pages/medical-record/MedicalRecordDetailPage'))
const MedicalRecordListPage = lazy(() => import('../pages/medical-record/MedicalRecordListPage'))
const MedicalRecordUploadPage = lazy(() => import('../pages/medical-record/MedicalRecordUploadPage'))
const PatientListPage = lazy(() => import('../pages/patient/PatientListPage'))
const PatientSearchPage = lazy(() => import('../pages/patient/PatientSearchPage'))
const PrescriptionPage = lazy(() => import('../pages/prescription/PrescriptionPage'))

function RouteFallback() {
  return (
    <div className="grid min-h-64 place-items-center">
      <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#2563EB]" />
    </div>
  )
}

function lazyPage(Page: ComponentType) {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Page />
    </Suspense>
  )
}

function PatientSearchRedirect() {
  const location = useLocation()
  return <Navigate to={`/patients/detail${location.search}`} replace />
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: lazyPage(LoginPage),
  },
  {
    path: '/register',
    element: lazyPage(RegisterPage),
  },
  {
    path: '/forgot-password',
    element: lazyPage(ForgotPasswordPage),
  },
  {
    path: '/reset-password',
    element: lazyPage(ResetPasswordPage),
  },
  {
    path: '/account/validate-token',
    element: lazyPage(ValidateTokenPage),
  },
  {
    element: <PrivateRoute />,
    children: [
      {
        element: <MainLayout />,
        children: [
          { index: true, element: <DefaultRedirect /> },
          {
            element: <PermissionRoute permission="dashboard:view" />,
            children: [
              { path: '/dashboard', element: lazyPage(DashboardPage) },
              { path: '/audit-logs', element: lazyPage(AuditLogPage) },
            ],
          },
          { path: '/profile', element: lazyPage(ProfilePage) },
          {
            element: <PermissionRoute permission="medical-records:view" />,
            children: [
              { path: '/medical-records', element: lazyPage(MedicalRecordListPage) },
              { path: '/medical-records/:id', element: lazyPage(MedicalRecordDetailPage) },
              { path: '/medical-records/:id/prescription', element: lazyPage(PrescriptionPage) },
            ],
          },
          {
            element: <PermissionRoute permission="medical-records:create" />,
            children: [{ path: '/medical-records/upload', element: lazyPage(MedicalRecordUploadPage) }],
          },
          {
            element: <PermissionRoute permission="medical-records-approval:create" />,
            children: [{ path: '/medical-records-approval', element: lazyPage(MedicalRecordApprovalPage) }],
          },
          {
            element: <PermissionRoute permission="patient-search:view" />,
            children: [
              { path: '/patient-search', element: <PatientSearchRedirect /> },
              { path: '/patients', element: lazyPage(PatientListPage) },
              { path: '/patients/detail', element: lazyPage(PatientSearchPage) },
              { path: '/patients/search', element: <Navigate to="/patients/detail" replace /> },
            ],
          },
          {
            element: <PermissionRoute permission="accounts:view" />,
            children: [
              { path: '/accounts', element: lazyPage(AccountListPage) },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
