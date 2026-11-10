// タグ別のアニメ一覧ページ（/season/2026-autumn・/tags/123）の共通処理
import { escapeHtml, renderPage, shellHtml, siteOrigin, type ApiTag, type ApiWorkList, type Env } from './lib'
import { apiGet, type CacheContext } from './cache'
import { isSeasonName, rankingPath, rankingTitle, tagPageDescription, tagPageTitle, tagPath } from './seo'

/** 放送時期のURL名（2026-autumn）から放送時期タグを探す */
export async function findSeasonTag(ctx: CacheContext, label: string): Promise<ApiTag | undefined> {
  const { data } = await apiGet<{ tags: ApiTag[] }>(ctx, '/api/tags?kind=season')
  return data?.tags.find((t) => t.kind === 'season' && t.name === label)
}

export async function renderTagPage(ctx: CacheContext, tag: ApiTag): Promise<Response> {
  const { request, env } = ctx
  const url = new URL(request.url)
  const origin = siteOrigin(env, request)
  const path = tagPath(tag)
  // 並び替え・ページ送り・絞り込みの追加は無数に組み合わせがあるので索引させない（リンクはたどらせる）
  const extra = [...url.searchParams.keys()].length > 0

  const list = await apiGet<ApiWorkList>(ctx, `/api/works?tag=${tag.id}`)
  const works = list.data?.works ?? []
  const title = tagPageTitle(tag.name)
  const description = tagPageDescription(tag.name, list.data?.total)

  // 放送時期のページから、その時期のランキングへ
  const season = path.startsWith('/season/') ? path.slice('/season/'.length) : ''
  const rankingLinks = isSeasonName(season)
    ? `<p><a href="${rankingPath('sequel', season)}">${escapeHtml(rankingTitle('sequel', season))}</a> / ` +
      `<a href="${rankingPath('complete', season)}">${escapeHtml(rankingTitle('complete', season))}</a></p>`
    : ''
  const items = works
    .map((w) => `<li><a href="/works/${w.id}">${escapeHtml(w.title)}</a>（続編希望 ${w.tally.total.sequel} / キレイに終わった ${w.tally.total.complete}）</li>`)
    .join('')

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'FanVoice', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: 'タグ', item: `${origin}/tags` },
      { '@type': 'ListItem', position: 3, name: tag.name, item: `${origin}${path}` },
    ],
  }

  return renderPage(env, request, {
    title,
    description,
    canonical: `${origin}${path}`,
    noindex: extra,
    jsonLd,
    bodyHtml: shellHtml(`<h1>${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p>${rankingLinks}<ul>${items}</ul>`),
    // 画面（WorksPage）が同じ一覧をもう一度取りに行かないよう、初期データとして埋め込む
    initialData: list.data && !extra ? { id: 'fv-initial-works', data: { tag: tag.id, list: list.data } } : undefined,
  })
}

export function notFoundTag(env: Env, request: Request, canonical: string): Promise<Response> {
  return renderPage(env, request, { title: 'タグが見つかりません', canonical, noindex: true, status: 404 })
}
