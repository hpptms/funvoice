// 全リクエスト共通: 正規ドメイン（SITE_URL = https://funvoice.jp）以外からのアクセスを受け付けない。
// Pages は funvoice.pages.dev やデプロイごとのURL（<hash>.funvoice.pages.dev）でも同じサイトを公開してしまうため、
// - /api/* は 403（バックエンドと通信できるのは funvoice.jp だけにする）
// - ページの GET/HEAD は funvoice.jp へ 301（SEO上の重複ページも防ぐ）
// - それ以外のメソッドは 403
// ローカルの wrangler pages dev（localhost / 127.0.0.1）だけは例外として通す。
import type { Env } from '../edge/lib'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])

export const onRequest: PagesFunction<Env> = async ({ request, env, next }) => {
  if (!env.SITE_URL) return next()
  const site = new URL(env.SITE_URL)
  const url = new URL(request.url)
  if (url.hostname === site.hostname || LOCAL_HOSTS.has(url.hostname)) return assetGuard(url, await next())

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
  if (!(res.headers.get('Content-Type') ?? '').includes('text/html')) return res
  return new Response('Not Found', { status: 404, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain' } })
}
