// /finales  今週最終回のアニメ（最終回を迎えた作品・まもなく最終回の作品）
import { escapeHtml, firstCardImage, renderPage, shellHtml, siteOrigin, type ApiWork, type Env } from '../edge/lib'
import { apiGet } from '../edge/cache'
import { FINALES_DESCRIPTION, FINALES_TITLE, broadcastTimeLabel, currentSeasonName, rankingPath, rankingTitle } from '../edge/seo'

type FinaleWork = ApiWork & { lastBroadcastAt: string }

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx
  const origin = siteOrigin(env, request)
  const canonical = `${origin}/finales`
  const { data } = await apiGet<{ ended: FinaleWork[]; upcoming: FinaleWork[] }>(ctx, '/api/finales')
  if (!data) {
    const res = await renderPage(env, request, { canonical, noindex: true, status: 503 })
    res.headers.set('Retry-After', '600')
    return res
  }
  const list = (works: FinaleWork[]) =>
    works.length
      ? `<ul>${works
          .map(
            (w) =>
              `<li><a href="/works/${w.id}">${escapeHtml(w.title)}</a> 最終回 ${escapeHtml(broadcastTimeLabel(w.lastBroadcastAt))}` +
              `（続編希望 ${w.tally.total.sequel} / キレイに終わった ${w.tally.total.complete}）</li>`,
          )
          .join('')}</ul>`
      : '<p>該当する作品はありません。</p>'
  const all = [...data.ended, ...data.upcoming]
  const season = currentSeasonName()
  return renderPage(env, request, {
    title: FINALES_TITLE,
    description: FINALES_DESCRIPTION,
    canonical,
    // 最終回の時期だけ中身があるページなので、作品が無いときは載せない
    noindex: all.length === 0 || new URL(request.url).search.length > 1,
    preloadImage: firstCardImage(all),
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: '今週最終回のアニメ',
      url: canonical,
      numberOfItems: all.length,
      itemListElement: all.map((w, i) => ({ '@type': 'ListItem', position: i + 1, name: w.title, url: `${origin}/works/${w.id}` })),
    },
    bodyHtml: shellHtml(
      `<h1>今週最終回のアニメ</h1><p>${escapeHtml(FINALES_DESCRIPTION)}</p>` +
        `<h2>最終回を迎えた作品（直近10日）</h2>${list(data.ended)}` +
        `<h2>まもなく最終回（7日以内）</h2>${list(data.upcoming)}` +
        `<p><a href="${rankingPath('sequel', season)}">${escapeHtml(rankingTitle('sequel', season))}</a></p>`,
    ),
    initialData: { id: 'fv-initial-finales', data },
  })
}
