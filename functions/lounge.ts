// /lounge  雑談掲示板（作品に紐づかないトピックの一覧）
import { escapeHtml, renderPage, shellHtml, siteOrigin, type Env } from '../edge/lib'
import { apiGet } from '../edge/cache'
import { LOUNGE_DESCRIPTION, LOUNGE_LEAD, LOUNGE_TITLE } from '../edge/seo'
import { maskSpoilers } from '../edge/spoiler'

interface LoungeThreads {
  threads: { id: number; title: string; postCount: number; lastPostedAt: string; excerpt: string }[]
  total: number
  page: number
  perPage: number
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx
  const origin = siteOrigin(env, request)
  const canonical = `${origin}/lounge`
  const { data } = await apiGet<LoungeThreads>(ctx, '/api/lounge/threads?sort=active&page=1')
  if (!data) {
    const res = await renderPage(env, request, { canonical, noindex: true, status: 503 })
    res.headers.set('Retry-After', '600')
    return res
  }
  const items = data.threads
    .map(
      (t) =>
        `<li><a href="/threads/${t.id}">${escapeHtml(t.title)}</a> ${t.postCount}コメント` +
        `<p>${escapeHtml(maskSpoilers(t.excerpt))}</p></li>`,
    )
    .join('')
  return renderPage(env, request, {
    title: LOUNGE_TITLE,
    description: LOUNGE_DESCRIPTION,
    canonical,
    noindex: new URL(request.url).search.length > 1,
    jsonLd: {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'ItemList',
          name: '雑談掲示板のトピック',
          url: canonical,
          numberOfItems: data.threads.length,
          itemListElement: data.threads.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.title, url: `${origin}/threads/${t.id}` })),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'FunVoice', item: `${origin}/` },
            { '@type': 'ListItem', position: 2, name: '雑談掲示板', item: canonical },
          ],
        },
      ],
    },
    bodyHtml: shellHtml(`<h1>雑談掲示板</h1><p>${escapeHtml(LOUNGE_LEAD)}</p><ul>${items}</ul>`),
    initialData: { id: 'fv-initial-lounge', data },
  })
}
