import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    // 0.0.0.0 で待ち受け、同じLAN内の別PCから http://<このPCのIP>:5173 で見られるようにする
    host: true,
    port: 5173,
    strictPort: true,
    // Macのホスト名（xxx.local）でのアクセスも許可
    allowedHosts: ['.local'],
    proxy: {
      // /api はGoのバックエンドへ転送（同一オリジン扱いになるのでCORS設定が不要）
      '/api': {
        target: 'http://127.0.0.1:8090',
        // 閲覧者のIPを X-Forwarded-For でバックエンドに渡す。
        // これが無いと全員が 127.0.0.1 に見え、匿名票が全員で1票扱いになってしまう
        xfwd: true,
      },
    },
  },
})
