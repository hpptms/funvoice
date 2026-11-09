import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

// Google タグマネージャー（GA4 は GTM のコンテナ内で設定する）。
// CSP で script-src 'self' にしているため、インラインの <script> ではなくここから読み込む。
const GTM_ID = 'GTM-MGVRF2F8'

// 管理画面は計測しない
const EXCLUDED = /^\/admin(\/|$)/

// 本番ビルドだけで計測する（ローカル開発・プレビューのアクセスを混ぜない）
const ENABLED = import.meta.env.PROD && typeof window !== 'undefined'

type DataLayer = unknown[]
declare global {
  interface Window {
    dataLayer?: DataLayer
  }
}

function dataLayer(): DataLayer {
  return (window.dataLayer = window.dataLayer || [])
}

export function initAnalytics() {
  if (!ENABLED || EXCLUDED.test(location.pathname)) return
  const dl = dataLayer()
  // gtag() 形式のコマンドも GTM に渡せるようにしておく
  // eslint-disable-next-line prefer-rest-params
  const gtag = function (..._args: unknown[]) { dl.push(arguments) }
  gtag('js', new Date())
  dl.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
  const s = document.createElement('script')
  s.async = true
  s.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
  document.head.appendChild(s)
}

// ページのタイトルはデータ取得後に usePageMeta が書き換えるので、少し待ってから送る
const TITLE_WAIT_MS = 800

/**
 * SPA の画面遷移ごとに dataLayer へ page_view イベントを送る。
 * GTM 側では「カスタムイベント = page_view」をトリガーにして GA4 の page_view を送信する。
 */
export function usePageViewTracking() {
  const { pathname, search } = useLocation()
  useEffect(() => {
    if (!ENABLED || EXCLUDED.test(pathname)) return
    let sent = false
    const send = () => {
      if (sent) return
      sent = true
      dataLayer().push({
        event: 'page_view',
        page_location: location.origin + pathname + search,
        page_path: pathname + search,
        page_title: document.title,
      })
    }
    const timer = setTimeout(send, TITLE_WAIT_MS)
    // 待っている間に次のページへ移動したら、その時点のタイトルで送ってしまう（取りこぼし防止）
    return () => {
      clearTimeout(timer)
      send()
    }
  }, [pathname, search])
}
