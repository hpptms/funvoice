import { api } from '../api/client'

// プッシュ通知（Web Push）。通知をオンにしたブラウザだけ Service Worker（/sw.js）を登録する。
//
// iPhone・iPad は「ホーム画面に追加」したFanVoiceからだけ通知を受け取れる（Safari のタブでは使えない）。

export type PushSupport =
  | 'supported'
  /** iPhone・iPad の Safari（ホーム画面に追加すれば使える） */
  | 'ios-needs-install'
  | 'unsupported'

function isIOS(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

function isStandalone(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}

export function pushSupport(): PushSupport {
  if (typeof window === 'undefined') return 'unsupported'
  const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  if (isIOS() && !isStandalone()) return 'ios-needs-install'
  return ok ? 'supported' : 'unsupported'
}

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(padded)
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

/** このブラウザの購読（無ければ null） */
export async function currentSubscription(): Promise<PushSubscription | null> {
  if (pushSupport() !== 'supported') return null
  const reg = await navigator.serviceWorker.getRegistration('/')
  return (await reg?.pushManager.getSubscription()) ?? null
}

/** 通知の許可を求め、このブラウザで通知を受け取れるようにしてサーバーに登録する */
export async function enablePush(): Promise<void> {
  if (pushSupport() !== 'supported') throw new Error('このブラウザはプッシュ通知に対応していません')
  const { enabled, publicKey } = await api.me.pushKey()
  if (!enabled || !publicKey) throw new Error('プッシュ通知は現在利用できません')
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error(
      permission === 'denied'
        ? '通知がブロックされています。ブラウザのサイトの設定で、funvoice.jp の通知を「許可」にしてください'
        : '通知が許可されませんでした',
    )
  }
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
  await navigator.serviceWorker.ready
  const key = urlBase64ToUint8Array(publicKey)
  let sub = await reg.pushManager.getSubscription()
  // サーバーの鍵が変わっていたら購読し直す
  const current = sub?.options.applicationServerKey
  if (sub && current && !sameKey(new Uint8Array(current), key)) {
    await sub.unsubscribe()
    sub = null
  }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key })
  await api.me.subscribePush(sub.toJSON())
}

/** このブラウザで通知を受け取るのをやめる */
export async function disablePush(): Promise<void> {
  const sub = await currentSubscription()
  if (!sub) return
  await api.me.unsubscribePush(sub.endpoint).catch(() => undefined)
  await sub.unsubscribe()
}

function sameKey(a: Uint8Array, b: Uint8Array): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}
