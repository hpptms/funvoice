import type { SubscriptionInfo } from '../api/client'

/** サポーターの特典（マイページ・説明文で共通） */
export const SUPPORTER_PERKS = [
  '掲示板のコメントに「★サポーター」バッジを表示',
  'サイト内の広告を表示しない（広告は今後導入予定）',
] as const

// 0円の通貨（円など）は最小単位がそのまま金額。それ以外は 1/100
const ZERO_DECIMAL = new Set(['jpy', 'krw', 'vnd', 'clp', 'pyg', 'ugx', 'xaf', 'xof'])

const INTERVAL_LABEL: Record<string, string> = { day: '日', week: '週', month: '月', year: '年' }

/** 「月額 300円」「3か月ごと 900円」のような表示 */
export function formatPrice(p: NonNullable<SubscriptionInfo['price']>): string {
  const cur = p.currency.toLowerCase()
  const amount = ZERO_DECIMAL.has(cur) ? p.amount : p.amount / 100
  const money =
    cur === 'jpy'
      ? `${amount.toLocaleString('ja-JP')}円`
      : new Intl.NumberFormat('ja-JP', { style: 'currency', currency: cur.toUpperCase() }).format(amount)
  const unit = INTERVAL_LABEL[p.interval]
  if (!unit) return money
  if (p.intervalCount > 1) return `${p.intervalCount}${p.interval === 'month' ? 'か月' : unit}ごと ${money}`
  return `${unit}額 ${money}`
}

/**
 * サーバーから受け取った移動先が Stripe の画面かを確認する（念のため。想定外のURLへは移動しない）。
 * 決済ページ checkout.stripe.com・顧客ポータル billing.stripe.com のみ。
 */
export function isStripeUrl(u: string): boolean {
  try {
    const url = new URL(u)
    return url.protocol === 'https:' && (url.hostname === 'checkout.stripe.com' || url.hostname === 'billing.stripe.com')
  } catch {
    return false
  }
}

/** 日付だけ（2026年12月12日） */
export function formatDay(iso: string): string {
  return new Date(iso).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Tokyo' })
}
