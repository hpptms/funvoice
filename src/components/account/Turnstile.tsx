import { Box } from '@mui/material'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'

// Cloudflare Turnstile（人間チェック）。多くの場合は自動で完了し、怪しいときだけチェックボックス等が出る。
// スクリプトは登録画面を開いたときだけ読み込む（CSP: script-src / frame-src に challenges.cloudflare.com を許可済み）。

interface TurnstileApi {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string
  reset: (id: string) => void
  remove: (id: string) => void
}
declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let loading: Promise<TurnstileApi> | null = null

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = SCRIPT_URL
    s.async = true
    s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('turnstile')))
    s.onerror = () => {
      loading = null
      reject(new Error('人間チェックを読み込めませんでした。ページを再読み込みしてください'))
    }
    document.head.appendChild(s)
  })
  return loading
}

export interface TurnstileHandle {
  /** トークンは1回しか使えないので、送信に失敗したらやり直す */
  reset: () => void
}

interface Props {
  siteKey: string
  /** どの画面のチェックか。サーバーが一致を確認する（英数字・_・- で32文字まで） */
  action: string
  onToken: (token: string) => void
  onError?: (msg: string) => void
}

const Turnstile = forwardRef<TurnstileHandle, Props>(
  function Turnstile({ siteKey, action, onToken, onError }, ref) {
    const el = useRef<HTMLDivElement>(null)
    const widget = useRef<string | null>(null)
    // コールバックは最新のものを使う（描画し直さずに済むように）
    const cb = useRef({ onToken, onError })
    useEffect(() => {
      cb.current = { onToken, onError }
    })

    useImperativeHandle(ref, () => ({
      reset: () => {
        cb.current.onToken('')
        if (widget.current && window.turnstile) window.turnstile.reset(widget.current)
      },
    }))

    useEffect(() => {
      let cancelled = false
      loadTurnstile()
        .then((t) => {
          if (cancelled || !el.current) return
          widget.current = t.render(el.current, {
            sitekey: siteKey,
            action,
            language: 'ja',
            theme: 'auto',
            callback: (token: string) => cb.current.onToken(token),
            'expired-callback': () => cb.current.onToken(''),
            'error-callback': () => {
              cb.current.onToken('')
              cb.current.onError?.('人間チェックに失敗しました。少し待ってからやり直してください')
            },
          })
        })
        .catch((e: Error) => cb.current.onError?.(e.message))
      return () => {
        cancelled = true
        if (widget.current && window.turnstile) window.turnstile.remove(widget.current)
        widget.current = null
      }
    }, [siteKey, action])

    // ウィジェットの高さ（65px）を先に確保して、読み込み後にレイアウトがずれないようにする
    return <Box ref={el} sx={{ minHeight: 65 }} />
  },
)

export default Turnstile
