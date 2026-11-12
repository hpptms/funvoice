import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { afterPageLoad } from './afterPageLoad'
import { installCollectRewrite } from './collectRewrite'

// Google タグマネージャー（GA4 は GTM のコンテナ内で設定する）。
// CSP で script-src 'self' にしているため、インラインの <script> ではなくここから読み込む。
// 広告ブロッカーに止められにくいよう、スクリプトは自サイトの /gt.js（functions/gt.js.ts が gtm.js を中継）から読み込み、
// 計測データは自サイトの /k/ 宛てに送る（functions/k/[d].ts が Google へ転送）。どちらもエッジだけで完結する
const GTM_SRC = '/gt.js'
const COLLECT_PATH = '/k'

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
  // GA4 の送信先を自サイトにする（GTM 内の GA4 タグにもこの設定が効く）。'js' より前に入れないと効かない
  const collectBase = location.origin + COLLECT_PATH
  gtag('set', 'transport_url', collectBase)
  gtag('js', new Date())
  installCollectRewrite(collectBase)
  dl.push({ 'gtm.start': Date.now(), event: 'gtm.js' })
  // gtm.js（約180KB）は画面の表示に必要な通信（JS・画像）と回線を取り合い、スマホの LCP を大きく遅らせるため、
  // ページの読み込みが終わって手が空いてから読み込む。それまでの page_view は dataLayer に溜まり、読み込み後にまとめて送られる
  const load = () => {
    const s = document.createElement('script')
    s.async = true
    s.src = GTM_SRC
    document.head.appendChild(s)
  }
  afterPageLoad(load)
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
