// /  トップ（作品一覧）。
// タグ1つだけの一覧（以前の /?tag=N）は、タグ別ページ（/season/2026-autumn・/tags/N）へ 301 で転送する
import { escapeHtml, renderPage, shellHtml, siteOrigin, type ApiTag, type ApiWorkList, type Env } from '../edge/lib'
import { apiGet } from '../edge/cache'
import { DEFAULT_DESCRIPTION, SITE_NAME, TOP_HEADING, TOP_LEAD, rankingPath, rankingTitle, tagPath } from '../edge/seo'

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx
  const url = new URL(request.url)
  const origin = siteOrigin(env, request)
  const tags = url.searchParams.getAll('tag')

  if (tags.length === 1 && /^[1-9]\d{0,17}$/.test(tags[0])) {
    const tag = (await apiGet<ApiTag>(ctx, `/api/tags/${tags[0]}`)).data
    if (tag) {
      const rest = new URLSearchParams(url.searchParams)
      rest.delete('tag')
      const qs = rest.toString()
      return Response.redirect(`${origin}${tagPath(tag)}${qs ? `?${qs}` : ''}`, 301)
    }
  }

  // 検索・並び替え・ページ送り・複数タグの組み合わせは無数にあるので索引させない（リンクはたどらせる）
  const noindex = url.search.length > 1
  const list = noindex ? undefined : await apiGet<ApiWorkList>(ctx, '/api/works')
  const works = list?.data?.works ?? []

  const items = works
    .map((w) => `<li><a href="/works/${w.id}">${escapeHtml(w.title)}</a>（続編希望 ${w.tally.total.sequel} / キレイに終わった ${w.tally.total.complete}）</li>`)
    .join('')
  const body = shellHtml(
    `<h1>${escapeHtml(TOP_HEADING)}</h1><p>${escapeHtml(TOP_LEAD)}</p>` +
      `<p><a href="${rankingPath('sequel')}">${rankingTitle('sequel')}</a> / <a href="${rankingPath('complete')}">${rankingTitle('complete')}</a></p>` +
      `<h2>みんなの評価が集まっているアニメ</h2><ul>${items}</ul>`,
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: 'ファンボイス',
    description: DEFAULT_DESCRIPTION,
    inLanguage: 'ja',
    url: `${origin}/`,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${origin}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }

  // 画面（WorksPage）が同じ一覧をもう一度取りに行かないよう、初期データとして埋め込む。
  // 読み込み中の表示から一覧に切り替わるときにフッターが押し下げられる（Lighthouse の CLS）のも防げる。
  const initialData = list?.data ? { id: 'fv-initial-works', data: { tag: null, list: list.data } } : undefined

  return renderPage(env, request, { canonical: `${origin}/`, noindex, jsonLd, bodyHtml: body, initialData })
}
