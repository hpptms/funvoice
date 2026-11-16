// 全リクエスト共通: 正規ドメイン（SITE_URL = https://funvoice.jp）以外からのアクセスを受け付けない。
// Pages は funvoice.pages.dev やデプロイごとのURL（<hash>.funvoice.pages.dev）でも同じサイトを公開してしまうため、
// - /api/* は 403（バックエンドと通信できるのは funvoice.jp だけにする）
// - ページの GET/HEAD は funvoice.jp へ 301（SEO上の重複ページも防ぐ）
// - それ以外のメソッドは 403
// ローカルの wrangler pages dev（localhost / 127.0.0.1）だけは例外として通す。
import { PAGE_MARKER, SECURITY_HEADERS, type Env } from '../edge/lib'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  if (!env.SITE_URL) return next()
  const site = new URL(env.SITE_URL)
  const url = new URL(request.url)
  if (url.hostname === site.hostname || LOCAL_HOSTS.has(url.hostname)) return notFoundGuard(url, assetGuard(url, await next()))

  const method = request.method.toUpperCase()
  if (url.pathname.startsWith('/api/') || (method !== 'GET' && method !== 'HEAD')) {
    return Response.json({ error: 'forbidden' }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
  }
  return Response.redirect(site.origin + url.pathname + url.search, 301)
}

// /assets/ に無いファイルを要求されると、Pages はSPAのフォールバックとして index.html を返す。
// /assets/* は _headers で1年キャッシュ（immutable）にしているため、デプロイ完了前に新しいファイル名へ
// アクセスされると、HTML が JS として Cloudflare に1年キャッシュされ、サイトが動かなくなる。
// これを防ぐため、/assets/ で HTML が返るときはキャッシュさせない 404 にする。
function assetGuard(url: URL, res: Response): Response {
  if (!url.pathname.startsWith('/assets/')) return res
  if (!isHtml(res)) return res
  return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain' } })
}

// ページはすべて Functions の renderPage で返している（目印 PAGE_MARKER が付く）。
// 目印の無い HTML は、どの Functions にも一致しなかったパス（/works/ や /foo など）への SPA フォールバックで、
// そのまま 200 で返すと canonical も noindex も無い「トップと同じ中身のページ」になり、Search Console で重複扱いになる。
// これを 404 + noindex にする（本文は index.html のままなので、画面では React の「ページが見つかりません」が出る）。
// 例外: 静的に置いた .html（Search Console の所有権確認ファイル）と、noindex 済みの埋め込みカード（/embed/）
function notFoundGuard(url: URL, res: Response): Response {
  if (res.headers.has(PAGE_MARKER)) {
    const r = new Response(res.body, res)
    r.headers.delete(PAGE_MARKER)
    return r
  }
  if (res.status !== 200 || !isHtml(res)) return res
  if (url.pathname.endsWith('.html') || url.pathname.startsWith('/embed/')) return res
  const headers = new Headers(SECURITY_HEADERS)
  headers.set('Content-Type', 'text/html; charset=utf-8')
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  headers.set('X-Robots-Tag', 'noindex')
  return new Response(res.body, { status: 404, headers })
}

function isHtml(res: Response): boolean {
  return (res.headers.get('Content-Type') ?? '').includes('text/html')
}
