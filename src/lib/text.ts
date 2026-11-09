/**
 * 利用者が入力した文字列を安全に表示するための処理。
 *
 * XSS対策の方針:
 *   - 文字列は React に「文字」として渡す（HTMLとして解釈させない）。innerHTML などは使わない
 *   - リンクにするのは http:// / https:// で始まるURLだけ。javascript: などは絶対にリンクにしない
 *   - 外部から来たURL（作品の公式サイトなど）も safeHttpUrl() を通してからリンクにする
 */

/** http(s) の絶対URLなら正規化して返す。それ以外（javascript:, data:, 相対URLなど）は null */
export function safeHttpUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw.trim())
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname ? url.href : null
  } catch {
    return null
  }
}

export type Token =
  | { type: 'text'; value: string }
  | { type: 'url'; value: string; href: string }
  | { type: 'anchor'; value: string; no: number }

// >>12 / ＞＞１２ / ≫12 と、http(s) のURL（空白・引用符・山括弧・全角の括弧/句読点で区切る）
const TOKEN_RE = /((?:>>|＞＞|≫)[0-9０-９]{1,4})|(https?:\/\/[^\s<>"'`（）「」『』【】、。！？]+)/g
// URLの末尾に付きがちな句読点はリンクに含めない
const TRAILING_PUNCT = /[.,!?;:]+$/

function toNumber(s: string): number {
  return Number(s.replace(/[０-９]/g, (c) => String(c.charCodeAt(0) - 0xff10)).replace(/[^0-9]/g, ''))
}

/** 本文を「文字」「URL」「>>番号」に分ける。表示側はこれを React の要素にするだけ */
export function tokenize(body: string): Token[] {
  const tokens: Token[] = []
  let last = 0
  const pushText = (s: string) => {
    if (!s) return
    const prev = tokens[tokens.length - 1]
    if (prev?.type === 'text') prev.value += s
    else tokens.push({ type: 'text', value: s })
  }
  for (const m of body.matchAll(TOKEN_RE)) {
    const i = m.index ?? 0
    pushText(body.slice(last, i))
    if (m[1]) {
      tokens.push({ type: 'anchor', value: m[1], no: toNumber(m[1]) })
      last = i + m[0].length
      continue
    }
    let url = m[2]
    // 末尾の句読点と、対応する "(" が無い ")" は外す（例: "(https://example.com)"）
    url = url.replace(TRAILING_PUNCT, '')
    while (url.endsWith(')') && (url.match(/\(/g)?.length ?? 0) < (url.match(/\)/g)?.length ?? 0)) url = url.slice(0, -1)
    const href = safeHttpUrl(url)
    if (href) tokens.push({ type: 'url', value: url, href })
    else pushText(url)
    last = i + url.length
  }
  pushText(body.slice(last))
  return tokens
}
