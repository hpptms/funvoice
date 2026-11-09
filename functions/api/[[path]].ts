// /api/* をMacのバックエンドへ中継する。
// - ブラウザから見て同一オリジンになるので、CORS設定が不要で、投票用Cookieもファーストパーティになる
// - 閲覧者のIP(CF-Connecting-IP)とシークレットを付けて転送する。バックエンドはシークレットの無いリクエストを拒否する
// - 公開GETは edge/cache.ts のキャッシュから返す（Macへの通信を減らす）
// - 書き込みが成功したら、バックエンドが X-FV-Invalidate で知らせたグループのキャッシュを無効化する（即時反映）
import { backendHeaders, type Env } from '../../edge/lib'
import { bumpGroups, cachedApiFetch, invalidatedGroups } from '../../edge/cache'

const UNAVAILABLE = () =>
  Response.json({ error: 'サーバーに接続できません。しばらくしてから再度お試しください' }, { status: 503 })

export const onRequest: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx
  const url = new URL(request.url)
  const method = request.method.toUpperCase()

  if (method === 'GET') {
    try {
      return await cachedApiFetch(ctx, url.pathname + url.search)
    } catch {
      return UNAVAILABLE()
    }
  }

  let res: Response
  try {
    res = await fetch(new URL(url.pathname + url.search, env.API_ORIGIN), {
      method,
      headers: backendHeaders(env, request, request.headers),
      body: method === 'HEAD' ? undefined : request.body,
      redirect: 'manual',
    })
  } catch {
    return UNAVAILABLE()
  }
  const out = new Response(res.body, res)
  if (res.ok) {
    // 無効化を済ませてから返す（直後の読み込みで新しいデータが返るように）
    await bumpGroups(invalidatedGroups(res)).catch(() => undefined)
  }
  out.headers.delete('X-FV-Invalidate')
  return out
}
