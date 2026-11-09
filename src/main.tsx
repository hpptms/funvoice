import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import StyleModeProvider from './components/StyleModeProvider'
import { preloadRoute } from './lazyPages'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
})

// 遅延読み込みのページへ直接来た場合は、そのページのJSを読み終えてから描画する（埋め込み本文のちらつき防止）
await preloadRoute(location.pathname)

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
