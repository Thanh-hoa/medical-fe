import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import DefaultRedirect from './DefaultRedirect'
import PermissionRoute from './PermissionRoute'
import PrivateRoute from './PrivateRoute'

const AccountListPage = lazy(() => import('../pages/account/AccountListPage'))
const AuditLogPage = lazy(() => import('../pages/audit-log/AuditLogPage'))
const ProfilePage = lazy(() => import('../pages/account/ProfilePage'))
const LoginPage = lazy(() => import('../pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'))
const ValidateTokenPage = lazy(() => import('../pages/auth/ValidateTokenPage'))
const DashboardPage = lazy(() => import('../pages/dashboard/DashboardPage'))
const MedicalRecordApprovalPage = lazy(() => import('../pages/medical-record/MedicalRecordApprovalPage'))
const MedicalRecordDetailPage = lazy(() => import('../pages/medical-record/MedicalRecordDetailPage'))
const MedicalRecordListPage = lazy(() => import('../pages/medical-record/MedicalRecordListPage'))
const MedicalRecordUploadPage = lazy(() => import('../pages/medical-record/MedicalRecordUploadPage'))
const PatientListPage = lazy(() => import('../pages/patient/PatientListPage'))
const PatientSearchPage = lazy(() => import('../pages/patient/PatientSearchPage'))

function RouteFallback() {
  return (
    <div className="grid min-h-64 place-items-center">
      <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-500" />
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
              { path: '/patient-search', element: lazyPage(PatientSearchPage) },
              { path: '/patients', element: lazyPage(PatientListPage) },
              { path: '/patients/search', element: <Navigate to="/patient-search" replace /> },
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
