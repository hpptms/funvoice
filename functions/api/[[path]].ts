// /api/* をMacのバックエンドへ中継する。
// - ブラウザから見て同一オリジンになるので、CORS設定が不要で、投票用Cookieもファーストパーティになる
// - 閲覧者のIP(CF-Connecting-IP)とシークレットを付けて転送する。バックエンドはシークレットの無いリクエストを拒否する
// - 公開GETはバックエンドの Cache-Control(s-maxage) に従って Cloudflare にキャッシュされる
import { backendHeaders, type Env } from '../../edge/lib'

const NO_CACHE_PATHS = [/\/my-vote$/, /^\/api\/admin\//]

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const target = new URL(url.pathname + url.search, env.API_ORIGIN)
  const method = request.method.toUpperCase()
  const cacheable = method === 'GET' && !NO_CACHE_PATHS.some((re) => re.test(url.pathname))

  let res: Response
  try {
    res = await fetch(target, {
      method,
      headers: backendHeaders(env, request, request.headers),
      body: method === 'GET' || method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
      cf: cacheable ? { cacheEverything: true } : undefined,
    })
  } catch {
    return Response.json({ error: 'サーバーに接続できません。しばらくしてから再度お試しください' }, { status: 503 })
  }
  return new Response(res.body, res)
}
