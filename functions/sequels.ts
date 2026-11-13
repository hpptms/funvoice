// /sequels  FanVoice で続編希望の声があった作品の続編決定（記録が少ないうちは検索エンジンに載せない）
import { escapeHtml, renderPage, shellHtml, siteOrigin, type ApiRelatedWork, type Env } from '../edge/lib'
import { apiGet } from '../edge/cache'
import { SEQUELS_DESCRIPTION, SEQUELS_MIN_ITEMS, SEQUELS_TITLE } from '../edge/seo'

interface Achievement {
  id: number
  work: ApiRelatedWork
  sequelWork?: ApiRelatedWork
  note?: string
  sequelVotes: number
  completeVotes: number
  announcedAt: string
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx
  const origin = siteOrigin(env, request)
  const canonical = `${origin}/sequels`
  const { data } = await apiGet<{ sequels: Achievement[] }>(ctx, '/api/sequels')
  if (!data) {
    const res = await renderPage(env, request, { canonical, noindex: true, status: 503 })
    res.headers.set('Retry-After', '600')
    return res
  }
  const items = data.sequels
    .map(
      (a) =>
        `<li><a href="/works/${a.work.id}">${escapeHtml(a.work.title)}</a> → ` +
        (a.sequelWork ? `<a href="/works/${a.sequelWork.id}">${escapeHtml(a.sequelWork.title)}</a>` : '続編決定') +
        `（発表時点で続編希望 ${a.sequelVotes}票${a.note ? `・${escapeHtml(a.note)}` : ''}）</li>`,
    )
    .join('')
  return renderPage(env, request, {
    title: SEQUELS_TITLE,
    description: SEQUELS_DESCRIPTION,
    canonical,
    noindex: data.sequels.length < SEQUELS_MIN_ITEMS || new URL(request.url).search.length > 1,
    bodyHtml: shellHtml(
      `<h1>続編決定アニメ一覧</h1><p>${escapeHtml(SEQUELS_DESCRIPTION)}</p>` + (items ? `<ul>${items}</ul>` : '<p>まだ記録がありません。</p>'),
    ),
    initialData: { id: 'fv-initial-sequels', data },
  })
}
