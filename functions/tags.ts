// /tags  タグ一覧
import { escapeHtml, renderPage, shellHtml, siteOrigin, type ApiTag, type Env } from '../edge/lib'
import { apiGet } from '../edge/cache'
import { TAGS_PAGE_DESCRIPTION, TAGS_PAGE_TITLE } from '../edge/seo'

const KIND_LABEL = { season: '放送時期', source: '原作・掲載誌', genre: 'ジャンル', other: 'その他' } as const

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx
  const { data } = await apiGet<{ tags: ApiTag[] }>(ctx, '/api/tags')
  const tags = (data?.tags ?? []).filter((t) => (t.workCount ?? 0) > 0)
  const sections = (Object.keys(KIND_LABEL) as (keyof typeof KIND_LABEL)[])
    .map((k) => {
      const items = tags.filter((t) => t.kind === k)
      if (!items.length) return ''
      return `<h2>${KIND_LABEL[k]}</h2><ul>${items
        .map((t) => `<li><a href="/?tag=${t.id}">#${escapeHtml(t.name)}</a>（${t.workCount}作品）</li>`)
        .join('')}</ul>`
    })
    .join('')
  return renderPage(env, request, {
    title: TAGS_PAGE_TITLE,
    description: TAGS_PAGE_DESCRIPTION,
    canonical: `${siteOrigin(env, request)}/tags`,
    bodyHtml: shellHtml(`<h1>${TAGS_PAGE_TITLE}</h1>${sections}`),
  })
}
