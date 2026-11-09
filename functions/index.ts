// /  トップ（作品一覧）。?tag=N 1つだけの場合は「タグ別一覧ページ」として検索に出す
import { apiGet, escapeHtml, renderPage, shellHtml, siteOrigin, type ApiTag, type ApiWorkList, type Env } from '../edge/lib'
import { DEFAULT_DESCRIPTION, SITE_NAME, TOP_HEADING, TOP_LEAD, tagPageDescription, tagPageTitle } from '../edge/seo'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const origin = siteOrigin(env, request)
  const tags = url.searchParams.getAll('tag')
  const extra = [...url.searchParams.keys()].some((k) => k !== 'tag')

  // 検索・並び替え・ページ送り・複数タグの組み合わせは無数にあるので索引させない（リンクはたどらせる）
  const singleTag = tags.length === 1 && /^[1-9]\d{0,17}$/.test(tags[0]) && !extra
  const noindex = tags.length > 1 || extra || (tags.length === 1 && !singleTag)

  let tag: ApiTag | undefined
  if (singleTag) tag = (await apiGet<ApiTag>(env, request, `/api/tags/${tags[0]}`)).data

  const list = await apiGet<ApiWorkList>(env, request, `/api/works${tag ? `?tag=${tag.id}` : ''}`)
  const works = list.data?.works ?? []

  const title = tag ? tagPageTitle(tag.name) : undefined
  const description = tag ? tagPageDescription(tag.name, list.data?.total) : undefined
  const canonical = tag ? `${origin}/?tag=${tag.id}` : `${origin}/`

  const items = works
    .map((w) => `<li><a href="/works/${w.id}">${escapeHtml(w.title)}</a>（続編希望 ${w.tally.total.sequel} / キレイに終わった ${w.tally.total.complete}）</li>`)
    .join('')
  const body = shellHtml(
    tag
      ? `<h1>${escapeHtml(title!)}</h1><p>${escapeHtml(description!)}</p><ul>${items}</ul>`
      : `<h1>${escapeHtml(TOP_HEADING)}</h1><p>${escapeHtml(TOP_LEAD)}</p><h2>みんなの評価が集まっているアニメ</h2><ul>${items}</ul>`,
  )

  const jsonLd = tag
    ? undefined
    : {
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

  return renderPage(env, request, { title, description, canonical, noindex, jsonLd, bodyHtml: body })
}
