import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initAnalytics } from './lib/analytics'
import StyleModeProvider from './components/StyleModeProvider'
import { preloadRoute } from './lazyPages'
import { installTranslateGuard } from './lib/translateGuard'
import { setupFonts } from './fonts'
import { loadStyleMode } from './lib/styleMode'

// ブラウザの自動翻訳で画面が落ちないようにする（Reactの描画より前に入れておく）
installTranslateGuard()

// 通信を減らすため、取得したデータは1分間そのまま使い、タブに戻っただけでは取り直さない。
// 自分の書き込み（投票・コメント等）は書き込みのレスポンスで画面のデータを直接更新しているので、待たずに反映される。
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } },
})

initAnalytics()

// 遅延読み込みのページへ直接来た場合は、そのページのJSを読み終えてから描画する（埋め込み本文のちらつき防止）。
// フォントがキャッシュ済みなら、そのCSSも描画前に読み込む（後から切り替わって文字がずれないように）
await Promise.all([preloadRoute(location.pathname), setupFonts(loadStyleMode() === 'retro')])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StyleModeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StyleModeProvider>
  </StrictMode>,
)
