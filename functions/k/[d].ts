// GA4 の計測データの中継（/k/<データ>）。
// GA4 は送信先を .../g/collect?v=2&tid=G-... という形で組み立てるが、この形は広告ブロッカーのリスト（EasyPrivacy）で
// 自サイト宛てでも止められる。そこで画面側（src/lib/collectRewrite.ts）がクエリを base64url にしてパスに入れて送り、
// ここで元に戻して Google へ転送する。Cloudflare のエッジだけで完結し、自宅のバックエンドには通信しない。
//
// 中継するのはこのサイトの GA4 プロパティ宛てだけ（他人のプロパティへの中継に使わせない）。
// ID は Google タグマネージャーのコンテナで設定している GA4 の測定ID
const MEASUREMENT_ID = 'G-4FS7F801NF'
const UPSTREAM = 'https://region1.google-analytics.com/g/collect'
const MAX_QUERY = 8192
const MAX_BODY = 64 * 1024

const done = (status: number) => new Response(null, { status, headers: { 'Cache-Control': 'no-store' } })

function decodeQuery(d: string): string | null {
  if (d.length > MAX_QUERY * 2 || !/^[A-Za-z0-9_-]+$/.test(d)) return null
  try {
    const bin = atob(d.replace(/-/g, '+').replace(/_/g, '/'))
    const q = new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)))
    if (q.length > MAX_QUERY) return null
    const sp = new URLSearchParams(q)
    return sp.get('v') === '2' && sp.get('tid') === MEASUREMENT_ID ? q : null
  } catch {
    return null
  }
}

export const onRequest: PagesFunction = async ({ request, params, waitUntil }) => {
  const method = request.method.toUpperCase()
  if (method !== 'POST' && method !== 'GET') return done(405)
  const q = decodeQuery(String(params.d ?? ''))
  if (!q) return done(400)
  const body = method === 'POST' ? await request.arrayBuffer() : undefined
  if (body && body.byteLength > MAX_BODY) return done(413)

  // 中継すると Google からは Cloudflare のIPに見えるため、地域の判定用に閲覧者のIPを渡す（直接送っていたときと同じ情報）
  const ip = request.headers.get('CF-Connecting-IP')
  const url = `${UPSTREAM}?${q}${ip ? `&_uip=${encodeURIComponent(ip)}` : ''}`
  const headers = new Headers({ 'Content-Type': 'text/plain;charset=UTF-8' })
  for (const h of ['User-Agent', 'Accept-Language']) {
    const v = request.headers.get(h)
    if (v) headers.set(h, v)
  }
  // ブラウザは返事を使わないので、Google への転送の完了は待たずに返す
  waitUntil(fetch(url, { method, headers, body }).then(() => undefined, () => undefined))
  return done(204)
}
