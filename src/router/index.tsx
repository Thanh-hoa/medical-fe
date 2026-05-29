import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from '../layouts/MainLayout'
import AccountListPage from '../pages/account/AccountListPage'
import LoginPage from '../pages/auth/LoginPage'
import DashboardPage from '../pages/dashboard/DashboardPage'
import MedicalRecordApprovalPage from '../pages/medical-record/MedicalRecordApprovalPage'
import MedicalRecordDetailPage from '../pages/medical-record/MedicalRecordDetailPage'
import MedicalRecordListPage from '../pages/medical-record/MedicalRecordListPage'
import MedicalRecordUploadPage from '../pages/medical-record/MedicalRecordUploadPage'
import PatientListPage from '../pages/patient/PatientListPage'
import PatientSearchPage from '../pages/patient/PatientSearchPage'
import DefaultRedirect from './DefaultRedirect'
import PermissionRoute from './PermissionRoute'
import PrivateRoute from './PrivateRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
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
            children: [{ path: '/dashboard', element: <DashboardPage /> }],
          },
          {
            element: <PermissionRoute permission="medical-records:view" />,
            children: [
              { path: '/medical-records', element: <MedicalRecordListPage /> },
              { path: '/medical-records/:id', element: <MedicalRecordDetailPage /> },
            ],
          },
          {
            element: <PermissionRoute permission="medical-records:create" />,
            children: [{ path: '/medical-records/upload', element: <MedicalRecordUploadPage /> }],
          },
          {
            element: <PermissionRoute permission="medical-records-approval:view" />,
            children: [{ path: '/medical-records-approval', element: <MedicalRecordApprovalPage /> }],
          },
          {
            element: <PermissionRoute permission="patient-search:view" />,
            children: [
              { path: '/patient-search', element: <PatientSearchPage /> },
              { path: '/patients', element: <PatientListPage /> },
              { path: '/patients/search', element: <Navigate to="/patient-search" replace /> },
            ],
          },
          {
            element: <PermissionRoute permission="accounts:view" />,
            children: [{ path: '/accounts', element: <AccountListPage /> }],
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
