// /ranking/sequel（2期が見たいアニメランキング）・/ranking/complete（キレイに終わったアニメランキング）
// /ranking/sequel/2026-autumn など放送時期別。/ranking は /ranking/sequel へ転送する
import { escapeHtml, renderPage, shellHtml, siteOrigin, type ApiRanking, type Env } from '../../edge/lib'
import { apiGet } from '../../edge/cache'
import {
  RANKING_MIN_WORKS,
  isRankingKind,
  isSeasonName,
  rankingDescription,
  rankingPath,
  rankingTitle,
  seasonLabelFromSlug,
} from '../../edge/seo'

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { request, env, params } = ctx
  const origin = siteOrigin(env, request)
  const parts = Array.isArray(params.path) ? params.path : params.path ? [params.path] : []
  const [kind, season, ...rest] = parts

  if (parts.length === 0) return Response.redirect(`${origin}${rankingPath('sequel')}`, 301)
  if (!isRankingKind(kind) || (season !== undefined && !isSeasonName(season)) || rest.length > 0) {
    return renderPage(env, request, { title: 'ページが見つかりません', canonical: `${origin}${rankingPath('sequel')}`, noindex: true, status: 404 })
  }

  const canonical = `${origin}${rankingPath(kind, season)}`
  const { data } = await apiGet<ApiRanking>(ctx, `/api/rankings?kind=${kind}${season ? `&season=${season}` : ''}`)
  if (!data) {
    const res = await renderPage(env, request, { canonical, noindex: true, status: 503 })
    res.headers.set('Retry-After', '600')
    return res
  }

  const title = rankingTitle(kind, season)
  const description = rankingDescription(kind, season)
  const count = (w: ApiRanking['works'][number]) => (kind === 'sequel' ? w.tally.total.sequel : w.tally.total.complete)
  const items = data.works
    .map(
      (w, i) =>
        `<li>${i + 1}位 <a href="/works/${w.id}">${escapeHtml(w.title)}</a> ${count(w)}票` +
        `（続編希望 ${w.tally.total.sequel} / キレイに終わった ${w.tally.total.complete}）</li>`,
    )
    .join('')
  const candidates = data.candidates
    .map((w) => `<li><a href="/works/${w.id}">${escapeHtml(w.title)}</a></li>`)
    .join('')
  const other = kind === 'sequel' ? 'complete' : 'sequel'
  const seasonPage = season ? `<p><a href="/season/${season}">${escapeHtml(seasonLabelFromSlug(season) ?? '')}のアニメ一覧</a></p>` : ''

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ItemList',
        name: title,
        description,
        url: canonical,
        numberOfItems: data.works.length,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        itemListElement: data.works.map((w, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: w.title,
          url: `${origin}/works/${w.id}`,
        })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'FanVoice', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: title, item: canonical },
        ],
      },
    ],
  }

  return renderPage(env, request, {
    title,
    description,
    canonical,
    // 票のある作品が少ないうちは中身の薄いページになるので、検索エンジンには載せない（票が集まれば自動で載る）
    noindex: data.works.length < RANKING_MIN_WORKS || new URL(request.url).search.length > 1,
    ogImage: `${origin}/api/og/rankings/${kind}.png${season ? `?season=${season}` : ''}`,
    jsonLd,
    bodyHtml: shellHtml(
      `<h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>` +
        (items ? `<ol style="list-style:none;padding:0">${items}</ol>` : '<p>まだ投票がありません。</p>') +
        (candidates ? `<h2>まだ票が少ない人気作品</h2><ul>${candidates}</ul>` : '') +
        `<p><a href="${rankingPath(other, season)}">${escapeHtml(rankingTitle(other, season))}</a></p>` +
        seasonPage,
    ),
    initialData: { id: 'fv-initial-ranking', data },
  })
}
