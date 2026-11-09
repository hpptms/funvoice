import { STATIC_PAGES, type StaticSlug } from './content'
import { DEFAULT_DESCRIPTION, SITE_NAME, pageTitle } from './seo'

export { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, summarize } from './seo'

// Cloudflare Pages Functions の共通処理。
// functions/ 以下のファイルはそのままURLになるため、共通コードはこのディレクトリに置く。

export interface Env {
  /** Pages の静的ファイル（dist/）を取得するためのバインディング */
  ASSETS: Fetcher
  /** Macのバックエンド（Cloudflare Tunnel のホスト名）例: https://api-origin.example.com */
  API_ORIGIN: string
  /** バックエンドと共有するシークレット。これが無いリクエストはバックエンドが拒否する */
  PROXY_SECRET: string
  /** 正規URL（canonical）に使うサイトのURL。未設定ならリクエストのオリジン。これ以外のホストからのアクセスは _middleware で拒否する */
  SITE_URL?: string
  /**
   * Cloudflare Access のサービストークン（任意）。API_ORIGIN を Access で保護すると、
   * このトークンを持たないリクエストは Cloudflare の入口で止まり、Macまで届かない
   */
  CF_ACCESS_CLIENT_ID?: string
  CF_ACCESS_CLIENT_SECRET?: string
}

// ---- API ----

export function clientIP(request: Request): string {
  return request.headers.get('CF-Connecting-IP') ?? ''
}

/** バックエンドへのリクエスト用ヘッダ。閲覧者が送ってきた同名ヘッダは必ず上書きする（偽装対策） */
export function backendHeaders(env: Env, request: Request, base?: Headers): Headers {
  const headers = new Headers(base)
  for (const h of [
    'host',
    'x-fv-client-ip',
    'x-fv-proxy-secret',
    'x-forwarded-for',
    'x-real-ip',
    'cf-access-client-id',
    'cf-access-client-secret',
  ])
    headers.delete(h)
  headers.set('X-FV-Client-IP', clientIP(request))
  headers.set('X-FV-Proxy-Secret', env.PROXY_SECRET)
  if (env.CF_ACCESS_CLIENT_ID && env.CF_ACCESS_CLIENT_SECRET) {
    headers.set('CF-Access-Client-Id', env.CF_ACCESS_CLIENT_ID)
    headers.set('CF-Access-Client-Secret', env.CF_ACCESS_CLIENT_SECRET)
  }
  return headers
}

/**
 * 公開APIをGETする（SEO用のHTML生成で使う）。
 * cacheEverything により、バックエンドの Cache-Control(s-maxage) に従って Cloudflare にキャッシュされ、
 * Macへのリクエストは数十秒〜数分に1回になる。
 */
export async function apiGet<T>(env: Env, request: Request, path: string): Promise<{ status: number; data?: T }> {
  try {
    const res = await fetch(new URL(path, env.API_ORIGIN), {
      headers: backendHeaders(env, request),
      cf: { cacheEverything: true },
    })
    if (!res.ok) return { status: res.status }
    return { status: res.status, data: (await res.json()) as T }
  } catch {
    return { status: 503 }
  }
}

// ---- エスケープ ----

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

/** <script> 内に埋め込むJSON。</script> で抜け出されないよう < などをエスケープする */
export function safeJSON(v: unknown): string {
  return JSON.stringify(v)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

/** http(s) 以外のURL（javascript: など）は捨てる */
export function safeUrl(u: string | undefined | null): string | null {
  if (!u) return null
  try {
    const url = new URL(u)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch {
    return null
  }
}

export function siteOrigin(env: Env, request: Request): string {
  return (env.SITE_URL || new URL(request.url).origin).replace(/\/$/, '')
}

// ---- HTML ----

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  // MUI(emotion) がインラインstyleを使うため style-src のみ 'unsafe-inline' を許可。スクリプトは自サイトのファイルのみ
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    // コメントに貼られた画像は元のサイトから直接表示するため、https の画像は許可する（画像はスクリプトを実行できない）
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.cloudinary.com",
    // 埋め込みプレーヤーは YouTube（Cookie を使わない youtube-nocookie.com）・Vimeo・ニコニコ動画だけを許可する
    "frame-src https://www.youtube-nocookie.com https://player.vimeo.com https://embed.nicovideo.jp",
    // コメントに貼られた https の動画ファイル（押すまで読み込まない）
    "media-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
}

export interface PageMeta {
  title?: string
  description?: string
  /** 正規URL（絶対URL） */
  canonical: string
  noindex?: boolean
  ogType?: 'website' | 'article' | 'video.tv_show' | 'video.movie'
  /** SNSで共有したときに表示する画像（絶対URL） */
  ogImage?: string
  jsonLd?: unknown
  /** JSなしでも読める本文（#root に入れる。React起動時に置き換わる） */
  bodyHtml?: string
  /** SPAに渡す初期データ（APIの二重取得を避ける） */
  initialData?: { id: string; data: unknown }
  status?: number
}

/** SPAの index.html に、ページごとのmeta・構造化データ・本文を埋め込んで返す */
export async function renderPage(env: Env, request: Request, meta: PageMeta): Promise<Response> {
  const shell = await env.ASSETS.fetch(new URL('/', request.url))
  const title = pageTitle(meta.title)
  const description = meta.description ?? DEFAULT_DESCRIPTION
  // 画像の無いページは、サイトのアイコンを SNS 共有の画像にする（小さめのカード）
  const ogImage = meta.ogImage ?? `${siteOrigin(env, request)}/icon-512.png`

  // meta はすべて escapeHtml（& < > " ' を変換）を通して自前で出力する
  const head = [
    `<meta name="description" content="${escapeHtml(description)}">`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:locale" content="ja_JP">`,
    `<meta property="og:type" content="${meta.ogType ?? 'website'}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(meta.canonical)}">`,
    `<meta property="og:image" content="${escapeHtml(ogImage)}">`,
    `<meta name="twitter:card" content="${meta.ogImage ? 'summary_large_image' : 'summary'}">`,
    meta.noindex ? `<meta name="robots" content="noindex, follow">` : '',
    meta.jsonLd ? `<script type="application/ld+json">${safeJSON(meta.jsonLd)}</script>` : '',
  ].join('')

  let rewriter = new HTMLRewriter()
    .on('title', { element: (e) => void e.setInnerContent(title) })
    .on('meta[name="description"]', { element: (e) => void e.remove() })
    // index.html のデフォルト値を消してから入れ直す（重複防止）
    .on('meta[property^="og:"]', { element: (e) => void e.remove() })
    .on('meta[name^="twitter:"]', { element: (e) => void e.remove() })
    .on('link[rel="canonical"]', { element: (e) => void e.remove() })
    .on('head', { element: (e) => void e.append(head, { html: true }) })

  if (meta.bodyHtml) {
    rewriter = rewriter.on('#root', { element: (e) => void e.setInnerContent(meta.bodyHtml!, { html: true }) })
  }
  if (meta.initialData) {
    const { id, data } = meta.initialData
    rewriter = rewriter.on('body', {
      element: (e) => void e.prepend(`<script id="${id}" type="application/json">${safeJSON(data)}</script>`, { html: true }),
    })
  }

  const res = rewriter.transform(shell)
  const headers = new Headers(res.headers)
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) headers.set(k, v)
  headers.set('Content-Type', 'text/html; charset=utf-8')
  headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  if (meta.noindex) headers.set('X-Robots-Tag', 'noindex')
  return new Response(res.body, { status: meta.status ?? 200, headers })
}

/** JSなしで読めるページ本文の外枠（React起動までの一瞬だけ表示される） */
export function shellHtml(inner: string): string {
  return `<main style="max-width:960px;margin:0 auto;padding:24px 16px;font-family:monospace;line-height:1.7">` +
    `<nav><a href="/">${SITE_NAME}</a> / <a href="/tags">タグ</a></nav>${inner}</main>`
}

// ---- API の型（frontend/src/api/client.ts と同じ形） ----

export interface ApiTag {
  id: number
  name: string
  kind: 'source' | 'genre' | 'season' | 'other'
  workCount?: number
}
export interface ApiWork {
  id: number
  title: string
  titleKana: string
  media: string
  seasonName: string
  episodesCount: number
  officialSiteUrl: string
  wikipediaUrl: string
  watchersCount: number
  source: 'annict' | 'user'
  approved: boolean
  locked: boolean
  youtubeId?: string
  imageUrl?: string
  image?: { id: string; url: string; fullUrl: string; width: number; height: number }
  tags: ApiTag[]
  tally: {
    registered: { sequel: number; complete: number }
    anonymous: { sequel: number; complete: number }
    total: { sequel: number; complete: number }
  }
}
export interface ApiWorkList {
  works: ApiWork[]
  total: number
}
export interface ApiThread {
  id: number
  workId: number
  workTitle: string
  title: string
  postCount: number
  createdAt: string
  lastPostedAt: string
  excerpt: string
  closed: boolean
  maxPosts: number
}
export interface ApiPost {
  id: number
  no: number
  name: string
  anonId: string
  isOwner: boolean
  body: string
  deleted: boolean
  plus: number
  minus: number
  replyCount: number
  createdAt: string
}
export interface ApiPostPage {
  posts: ApiPost[]
  total: number
  page: number
  perPage: number
}

// ---- 固定ページ ----

/** 固定ページの本文を、JSなしでも読めるHTMLにして返す */
export function renderStaticPage(env: Env, request: Request, slug: StaticSlug): Promise<Response> {
  const page = STATIC_PAGES[slug]
  const sections = page.sections
    .map(
      (s) =>
        `<h2>${escapeHtml(s.heading)}</h2>` +
        (s.paragraphs ?? []).map((p) => `<p>${escapeHtml(p)}</p>`).join('') +
        (s.list ? `<ul>${s.list.map((li) => `<li>${escapeHtml(li)}</li>`).join('')}</ul>` : ''),
    )
    .join('')
  return renderPage(env, request, {
    title: page.title,
    description: page.description,
    canonical: `${siteOrigin(env, request)}/${slug}`,
    ogType: 'article',
    bodyHtml: shellHtml(
      `<h1>${escapeHtml(page.title)}</h1>${page.updated ? `<p>最終更新：${escapeHtml(page.updated)}</p>` : ''}${sections}`,
    ),
  })
}
