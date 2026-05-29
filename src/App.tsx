import { RouterProvider } from 'react-router-dom'
import { App as AntdApp, ConfigProvider } from 'antd'
import { router } from './router'

const theme = {
  token: {
    colorPrimary: '#6366F1',
    colorInfo: '#6366F1',
    borderRadius: 14,
    fontFamily: 'Inter, system-ui, sans-serif',
    colorBgBase: '#F8FAFC',
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
