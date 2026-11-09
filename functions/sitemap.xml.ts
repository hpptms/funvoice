import { apiGet, escapeHtml, siteOrigin, type ApiTag, type Env } from '../edge/lib'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const origin = siteOrigin(env, request)
  const [works, tags] = await Promise.all([
    apiGet<{ works: { id: number; updatedAt: string }[]; threads?: { id: number; updatedAt: string }[] }>(env, request, '/api/sitemap'),
    apiGet<{ tags: ApiTag[] }>(env, request, '/api/tags'),
  ])
  if (!works.data) return new Response('Service Unavailable', { status: 503, headers: { 'Retry-After': '600' } })

  const url = (loc: string, lastmod?: string) =>
    `<url><loc>${escapeHtml(loc)}</loc>${lastmod ? `<lastmod>${escapeHtml(lastmod)}</lastmod>` : ''}</url>`
  const urls = [
    url(`${origin}/`),
    url(`${origin}/tags`),
    ...['about', 'terms', 'privacy', 'copyright', 'contact'].map((p) => url(`${origin}/${p}`)),
    ...(tags.data?.tags ?? []).filter((t) => (t.workCount ?? 0) > 0).map((t) => url(`${origin}/?tag=${t.id}`)),
    ...works.data.works.map((w) => url(`${origin}/works/${w.id}`, w.updatedAt)),
    ...(works.data.threads ?? []).map((t) => url(`${origin}/threads/${t.id}`, t.updatedAt)),
  ]
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>\n`
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
