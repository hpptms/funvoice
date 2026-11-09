import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

// @fontsource のCSSは各文字範囲ごとに woff2 と woff の両方を指定している。
// woff2 は現行の全ブラウザが対応しているので woff の指定を消し、CSS（表示前に必ず読まれる）を小さくする。
// woff ファイル自体も参照されなくなるので出力から消える。
function fontsourceWoff2Only(): Plugin {
  return {
    name: 'fontsource-woff2-only',
    enforce: 'pre',
    transform(code, id) {
      if (!/[\\/]@fontsource[\\/].*\.css$/.test(id)) return null
      return { code: code.replace(/,\s*url\([^)]*\.woff\)\s*format\(['"]woff['"]\)/g, ''), map: null }
    },
  }
}

export default defineConfig({
  plugins: [fontsourceWoff2Only(), react()],
  build: {
    rolldownOptions: {
      output: {
        // ランタイムは中身がほぼ変わらずハッシュも固定のため、名前を変えて誤ってキャッシュされたURLを避ける
        // （デプロイ完了前のアクセスで HTML がキャッシュされた事故の回避。再発防止は functions/_middleware.ts の assetGuard）
        chunkFileNames: (chunk) => (chunk.name === 'rolldown-runtime' ? 'assets/runtime-[hash].js' : 'assets/[name]-[hash].js'),
        // ライブラリをアプリのコードと別ファイルにする。サイトを更新してもライブラリのファイル名（ハッシュ）は変わらず、
        // 再訪問者はブラウザ・Cloudflareのキャッシュをそのまま使える（/assets/* は1年キャッシュ）
        codeSplitting: {
          groups: [
            { name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|scheduler|react-router|react-router-dom|cookie|set-cookie-parser)[\\/]/, priority: 30 },
            { name: 'mui', test: /[\\/]node_modules[\\/](@mui|@emotion|@babel[\\/]runtime|stylis|hoist-non-react-statics|react-is|react-transition-group|clsx|prop-types|@popperjs)[\\/]/, priority: 20 },
            { name: 'vendor', test: /[\\/]node_modules[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
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
