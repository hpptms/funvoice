// Google タグマネージャーのスクリプト（gtm.js）を、自サイトの /gt.js として配信する。
// 広告ブロッカーは googletagmanager.com や「gtm.js」という名前で読み込みを止めるため、名前と配信元を変えて計測の取りこぼしを減らす。
// Cloudflare のエッジだけで完結し、自宅のバックエンドには通信しない（取得結果はエッジで15分キャッシュ）。
// 取得先はこのコンテナに固定している（任意のURLを中継させない）。ID は src/lib/analytics.ts と同じもの
const GTM_ID = 'GTM-MGVRF2F8'
const UPSTREAM = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
const TTL = 900

export const onRequestGet: PagesFunction = async () => {
  const res = await fetch(UPSTREAM, { cf: { cacheTtl: TTL, cacheEverything: true } })
  if (!res.ok) return new Response('', { status: 502, headers: { 'Cache-Control': 'no-store' } })
  return new Response(res.body, {
    headers: {
      'Content-Type': 'application/javascript; charset=utf-8',
      'Cache-Control': `public, max-age=${TTL}`,
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
