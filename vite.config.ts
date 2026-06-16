import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll('\\', '/')

          if (!normalizedId.includes('node_modules')) return undefined

          if (/\/node_modules\/(react|react-dom|react-router-dom|scheduler)\//.test(normalizedId)) {
            return 'vendor-react'
          }

          if (normalizedId.includes('/node_modules/@tanstack/') || normalizedId.includes('/node_modules/zustand/')) {
            return 'vendor-state'
          }

          const packagePath = normalizedId.split('/node_modules/')[1]
          const packageParts = packagePath?.split('/') ?? []
          const packageName = packageParts[0]?.startsWith('@')
            ? `${packageParts[0].slice(1)}-${packageParts[1]}`
            : packageParts[0]

          if (!packageName) return 'vendor'

          if (packageName === 'antd') {
            const componentName = packageParts[1] === 'es' ? packageParts[2] : packageParts[1]
            return componentName ? `antd-${componentName}` : 'antd-core'
          }

          if (normalizedId.includes('/node_modules/@ant-design/') || /\/node_modules\/rc-/.test(normalizedId)) {
            return `vendor-${packageName}`
          }

          return `vendor-${packageName}`
        },
      },
    },
  },
})
