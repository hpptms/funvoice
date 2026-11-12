// 公開APIのエッジキャッシュ（Cloudflare の Cache API）。
//
// 目的: Mac（バックエンド）へのリクエストを減らしつつ、書き込みはすぐ反映させる。
// - 公開GETはバックエンドの s-maxage の間キャッシュから返す（Macに行かない）
// - 書き込みが成功すると、バックエンドが X-FV-Invalidate で「変わったデータのグループ」を返すので、
//   そのグループの世代番号を進める。キャッシュのキーに世代番号が入っているため、次の読み込みからは新しいデータになる
//   （一覧の ?page=2 など、URLの組み合わせを列挙しなくても全部まとめて無効化できる）
// - s-maxage を過ぎたら古いデータをすぐ返しつつ、裏で取り直す（stale-while-revalidate）
// - Mac が落ちているときは最大1日前のデータを返し続ける（stale-if-error）
//
// Cache API はデータセンターごとなので、無効化が即時に効くのは書き込んだ人と同じデータセンター。
// 他のデータセンターでは最大 s-maxage 秒遅れる（バックエンドの publicCache の秒数がその上限）。
import { backendHeaders, type Env } from './lib'
import { normalizeOgQuery } from './seo'

/** Pages Functions の context のうち、ここで使うもの */
export interface CacheContext {
  env: Env
  request: Request
  waitUntil: (p: Promise<unknown>) => void
}

const KEY_ORIGIN = 'https://fv-edge-cache.invalid'
/** キャッシュを保持する最長時間（Mac停止中に古いデータを返せる期間） */
const KEEP_SECONDS = 86400
/** s-maxage を過ぎてから、古いデータを返しつつ裏で取り直す猶予。これを過ぎたら取り直しを待つ */
const SWR_SECONDS = 600

/**
 * URL → キャッシュのグループ（バックエンドの invalidate() と対応）。null はキャッシュしない
 * （自分の票・自分の評価・管理APIなど、人によって内容が違うもの）。
 */
export function cacheGroups(pathname: string): string[] | null {
  let m: RegExpMatchArray | null
  if (/^\/api\/(works|tags|tags\/\d+|sitemap|rankings)$/.test(pathname)) return ['all', 'works']
  // サポーターの価格（人によって変わらない）
  if (pathname === '/api/billing/plan') return ['all']
  // SNS共有用の画像（作品の票が変わったら描き直す）
  if ((m = pathname.match(/^\/api\/og\/works\/(\d+)\.png$/))) return ['all', `work:${m[1]}`]
  if (/^\/api\/og\/(rankings\/(sequel|complete)|site)\.png$/.test(pathname)) return ['all', 'works']
  if ((m = pathname.match(/^\/api\/works\/(\d+)(?:\/(?:edits|threads))?$/))) return ['all', `work:${m[1]}`]
  if ((m = pathname.match(/^\/api\/threads\/(\d+)(?:\/posts(?:\/\d+)?)?$/))) return ['all', `thread:${m[1]}`]
  return null
}

function versionKey(group: string): string {
  return `${KEY_ORIGIN}/__version/${encodeURIComponent(group)}`
}

async function groupVersion(cache: Cache, group: string): Promise<string> {
  const res = await cache.match(versionKey(group))
  return res ? await res.text() : '0'
}

/** 書き込みの後、変わったグループの世代を進める */
export async function bumpGroups(groups: string[]): Promise<void> {
  if (groups.length === 0) return
  const cache = caches.default
  const v = `${Date.now()}${Math.random().toString(36).slice(2, 6)}`
  await Promise.all(
    groups.map((g) =>
      cache.put(versionKey(g), new Response(v, { headers: { 'Cache-Control': `public, max-age=${KEEP_SECONDS}` } })),
    ),
  )
}

/** バックエンドのレスポンスから、書き込みで変わったグループを読む */
export function invalidatedGroups(res: Response): string[] {
  const raw = res.headers.get('X-FV-Invalidate')
  if (!raw) return []
  return raw
    .split(/[\s,]+/)
    .filter((g) => /^(all|works|work:\d+|thread:\d+)$/.test(g))
}

function sMaxAge(res: Response): number | null {
  const cc = res.headers.get('Cache-Control') ?? ''
  if (!/\bpublic\b/.test(cc)) return null
  const m = cc.match(/s-maxage=(\d+)/)
  return m ? Number(m[1]) : null
}

async function fetchOrigin(ctx: CacheContext, pathAndQuery: string): Promise<Response> {
  return fetch(new URL(pathAndQuery, ctx.env.API_ORIGIN), {
    headers: backendHeaders(ctx.env, ctx.request, ctx.request.headers),
    redirect: 'manual',
  })
}

/** 取得したレスポンスをキャッシュに入れ、利用者に返す用のレスポンスを返す */
async function store(cache: Cache, key: string, res: Response): Promise<Response> {
  const ttl = sMaxAge(res)
  if (ttl === null || (res.status !== 200 && res.status !== 404)) return res
  const body = await res.arrayBuffer()
  const headers = new Headers(res.headers)
  headers.delete('Set-Cookie') // 公開データに他人のCookieが混ざらないように（念のため）
  const stored = new Headers(headers)
  stored.set('Cache-Control', `public, max-age=${KEEP_SECONDS}`)
  stored.set('X-FV-Stored-At', String(Date.now()))
  stored.set('X-FV-TTL', String(ttl))
  await cache.put(key, new Response(body, { status: res.status, headers: stored }))
  return new Response(body, { status: res.status, headers })
}

/** キャッシュから返すレスポンス（内部用のヘッダを外し、ブラウザ向けの Cache-Control に戻す） */
function fromCache(res: Response, state: 'HIT' | 'STALE'): Response {
  const headers = new Headers(res.headers)
  const ttl = headers.get('X-FV-TTL') ?? '0'
  headers.delete('X-FV-Stored-At')
  headers.delete('X-FV-TTL')
  headers.set('Cache-Control', `public, max-age=0, s-maxage=${ttl}`)
  headers.set('X-FV-Cache', state)
  return new Response(res.body, { status: res.status, headers })
}

/**
 * 公開APIをキャッシュ経由で取得する（GETのみ）。キャッシュ対象外のURLは毎回バックエンドへ。
 * 例外（Macに繋がらない等）はキャッシュが無いときだけ投げる。
 */
export async function cachedApiFetch(ctx: CacheContext, pathAndQuery: string): Promise<Response> {
  pathAndQuery = normalizeOgQuery(pathAndQuery)
  const url = new URL(pathAndQuery, 'https://x.invalid')
  const groups = cacheGroups(url.pathname)
  if (!groups) return fetchOrigin(ctx, pathAndQuery)

  const cache = caches.default
  const versions = await Promise.all(groups.map((g) => groupVersion(cache, g)))
  const key = `${KEY_ORIGIN}${url.pathname}${url.search}${url.search ? '&' : '?'}__v=${versions.join('.')}`

  const cached = await cache.match(key)
  if (cached) {
    const age = (Date.now() - Number(cached.headers.get('X-FV-Stored-At') ?? 0)) / 1000
    const ttl = Number(cached.headers.get('X-FV-TTL') ?? 0)
    if (age < ttl) return fromCache(cached, 'HIT')
    if (age < ttl + SWR_SECONDS) {
      // 古いデータをすぐ返し、裏で取り直す
      ctx.waitUntil(fetchOrigin(ctx, pathAndQuery).then((res) => store(cache, key, res)).catch(() => undefined))
      return fromCache(cached, 'STALE')
    }
    // 猶予も過ぎていれば取り直しを待つ。Macに繋がらない・5xx なら古いデータを返す
    try {
      const res = await fetchOrigin(ctx, pathAndQuery)
      if (res.status < 500) return withState(await store(cache, key, res), 'MISS')
    } catch {
      // 下で古いデータを返す
    }
    return fromCache(cached, 'STALE')
  }
  return withState(await store(cache, key, await fetchOrigin(ctx, pathAndQuery)), 'MISS')
}

function withState(res: Response, state: string): Response {
  const r = new Response(res.body, res)
  r.headers.set('X-FV-Cache', state)
  return r
}

/**
 * 公開APIをGETしてJSONで返す（SEO用のHTML生成で使う）。ブラウザからの /api/* と同じキャッシュを共有するので、
 * 書き込み直後にページを再読み込みしても、埋め込まれる初期データは新しいものになる。
 */
export async function apiGet<T>(ctx: CacheContext, path: string): Promise<{ status: number; data?: T }> {
  try {
    const res = await cachedApiFetch(ctx, path)
    if (!res.ok) return { status: res.status }
    return { status: res.status, data: (await res.json()) as T }
  } catch {
    return { status: 503 }
  }
}
