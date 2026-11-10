// /sitemap.xml  検索エンジンに載せるページの一覧。
// 作品はバックエンドが「載せる作品」（票・コメントのある作品、今期・前期の作品、人気作品）だけを返す
import { escapeHtml, siteOrigin, type ApiTag, type Env } from '../edge/lib'
import { apiGet } from '../edge/cache'
import { RANKING_MIN_WORKS, rankingPath, tagPath, type RankingKind } from '../edge/seo'

interface SitemapData {
  works: { id: number; updatedAt: string }[]
  threads?: { id: number; updatedAt: string }[]
  /** ランキングの候補と、それぞれのランキングに入る作品の数（season "" = 全期間） */
  rankings?: { season: string; sequel: number; complete: number }[]
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx
  const origin = siteOrigin(env, request)
  const [works, tags] = await Promise.all([apiGet<SitemapData>(ctx, '/api/sitemap'), apiGet<{ tags: ApiTag[] }>(ctx, '/api/tags')])
  if (!works.data) return new Response('Service Unavailable', { status: 503, headers: { 'Retry-After': '600' } })

  const url = (loc: string, lastmod?: string) =>
    `<url><loc>${escapeHtml(loc)}</loc>${lastmod ? `<lastmod>${escapeHtml(lastmod)}</lastmod>` : ''}</url>`
  const rankings = (works.data.rankings ?? []).flatMap((r) =>
    (['sequel', 'complete'] as RankingKind[])
      .filter((kind) => r[kind] >= RANKING_MIN_WORKS)
      .map((kind) => url(`${origin}${rankingPath(kind, r.season || undefined)}`)),
  )
  const urls = [
    url(`${origin}/`),
    url(`${origin}/tags`),
    ...['about', 'terms', 'privacy', 'copyright', 'contact'].map((p) => url(`${origin}/${p}`)),
    ...rankings,
    ...(tags.data?.tags ?? []).filter((t) => (t.workCount ?? 0) > 0).map((t) => url(`${origin}${tagPath(t)}`)),
    ...works.data.works.map((w) => url(`${origin}/works/${w.id}`, w.updatedAt)),
    ...(works.data.threads ?? []).map((t) => url(`${origin}/threads/${t.id}`, t.updatedAt)),
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
