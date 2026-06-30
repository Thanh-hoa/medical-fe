import { RouterProvider } from 'react-router-dom'
import { App as AntdApp, ConfigProvider } from 'antd'
import { router } from './router'

const theme = {
  token: {
    colorPrimary: '#2563EB',
    colorInfo: '#2563EB',
    borderRadius: 10,
    fontFamily: 'Inter, system-ui, sans-serif',
    colorBgBase: '#F7F9FC',
    colorTextBase: '#0F172A',
    colorTextSecondary: '#64748B',
    colorBorder: '#E5EAF1',
  },
}

export default function App() {
  return (
    <ConfigProvider theme={theme}>
      <AntdApp>
        <RouterProvider router={router} />
      </AntdApp>
    </ConfigProvider>
  )
}
