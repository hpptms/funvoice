// /works/:id  作品ページ。タイトル・説明文・OGP・構造化データ・本文をHTMLに埋め込む
import { escapeHtml, renderPage, safeUrl, shellHtml, siteOrigin, workLinkList, type ApiWork, type Env } from '../../edge/lib'
import { apiGet } from '../../edge/cache'
import {
  mediaLabel,
  rankingPath,
  rankingTitle,
  sequelPhrase,
  sequelQuestion,
  tagPath,
  workPageDescription,
  workPageTitle,
  yearsSinceSeason,
} from '../../edge/seo'

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { request, env, params } = ctx
  const id = String(params.id)
  const origin = siteOrigin(env, request)
  const canonical = `${origin}/works/${id}`

  // 作品の追加ページ（SPAの /works/new）
  if (id === 'new') {
    return renderPage(env, request, { title: '作品を追加', canonical, noindex: true })
  }
  if (!/^[1-9]\d{0,17}$/.test(id)) {
    return renderPage(env, request, { title: 'ページが見つかりません', canonical, noindex: true, status: 404 })
  }

  const [{ status, data: work }, threadsRes] = await Promise.all([
    apiGet<ApiWork>(ctx, `/api/works/${id}`),
    apiGet<{ threads: { id: number; title: string; postCount: number }[] }>(ctx, `/api/works/${id}/threads`),
  ])
  if (status === 404) {
    return renderPage(env, request, { title: '作品が見つかりません', canonical, noindex: true, status: 404 })
  }
  if (!work) {
    // バックエンド停止中など。SPAはそのまま返し、検索エンジンには一時的なエラーと伝える
    const res = await renderPage(env, request, { canonical, noindex: true, status: 503 })
    res.headers.set('Retry-After', '600')
    return res
  }

  const { sequel, complete } = work.tally.total
  const description = workPageDescription(work)
  const phrase = sequelPhrase(work.title, work.media)
  const staff = work.staff ?? []
  const seasonTag = work.tags.find((t) => t.kind === 'season')

  // SNS で共有したときのカード画像（作品名と票の割合）。?v= は票が変わったときに SNS 側のキャッシュを更新させるため
  const ogImage = `${origin}/api/og/works/${work.id}.png?v=${sequel}-${complete}`
  // 構造化データの image は、作品の紹介画像（Cloudinary に取り込んだ画像・YouTube のサムネイル）があればそれ。
  // 外部サイトの画像URL（引用元）は直接使わない
  const image = work.image
    ? work.image.fullUrl.replace('f_webp,fl_awebp', 'f_jpg')
    : work.youtubeId && /^[A-Za-z0-9_-]{11}$/.test(work.youtubeId)
      ? `https://i.ytimg.com/vi/${work.youtubeId}/hqdefault.jpg`
      : undefined

  const sameAs = [safeUrl(work.officialSiteUrl), safeUrl(work.wikipediaUrl)].filter(Boolean)
  const people = (role: string) => staff.filter((s) => s.role === role).map((s) => ({ '@type': 'Person', name: s.name }))
  const studios = staff.filter((s) => s.role === 'アニメーション制作').map((s) => ({ '@type': 'Organization', name: s.name }))
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': work.media === 'movie' ? 'Movie' : 'TVSeries',
        name: work.title,
        url: canonical,
        description,
        ...(sameAs.length ? { sameAs } : {}),
        ...(image ? { image } : {}),
        ...(work.media !== 'movie' && work.episodesCount > 0 ? { numberOfEpisodes: work.episodesCount } : {}),
        ...(people('監督').length ? { director: people('監督') } : {}),
        ...(studios.length ? { productionCompany: studios } : {}),
        genre: work.tags.filter((t) => t.kind === 'genre').map((t) => t.name),
        keywords: work.tags.map((t) => t.name).join(','),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'FanVoice', item: `${origin}/` },
          ...(seasonTag
            ? [{ '@type': 'ListItem', position: 2, name: `${seasonTag.name}のアニメ`, item: `${origin}${tagPath(seasonTag)}` }]
            : []),
          { '@type': 'ListItem', position: seasonTag ? 3 : 2, name: work.title, item: canonical },
        ],
      },
    ],
  }

  const years = yearsSinceSeason(work.seasonName)
  const facts = [
    seasonTag ? `<li>放送時期: <a href="${tagPath(seasonTag)}">${escapeHtml(seasonTag.name)}</a>${years ? `（放送から約${years}年）` : ''}</li>` : '',
    `<li>種類: ${escapeHtml(mediaLabel(work.media))}</li>`,
    work.episodesCount > 0 && work.media !== 'movie' ? `<li>話数: 全${work.episodesCount}話</li>` : '',
    ...staff.map((s) => `<li>${escapeHtml(s.role)}: ${escapeHtml(s.name)}</li>`),
  ].join('')

  const rank = work.seasonRank
  const rankLine =
    rank && /^\d{4}-(winter|spring|summer|autumn)$/.test(work.seasonName)
      ? `<p><a href="${rankingPath('sequel', work.seasonName)}">${escapeHtml(rankingTitle('sequel', work.seasonName))}</a>: ${rank.rank}位（${rank.total}作品中）</p>`
      : ''

  const series = (work.series ?? [])
    .map((g) => `<h2>「${escapeHtml(g.name)}」シリーズ</h2>${workLinkList(g.works)}`)
    .join('')
  const seasonWorks = work.seasonWorks?.length && seasonTag
    ? `<h2>同じ${escapeHtml(seasonTag.name)}のアニメ</h2>${workLinkList(work.seasonWorks)}`
    : ''

  const tagLinks = work.tags.map((t) => `<li><a href="${tagPath(t)}">#${escapeHtml(t.name)}</a></li>`).join('')
  const official = safeUrl(work.officialSiteUrl)
  const body = shellHtml(
    `<h1>${escapeHtml(work.title)}</h1>` +
      `<p>${escapeHtml(sequelQuestion(work.title, work.media))}</p>` +
      `<p>${escapeHtml(description)}</p>` +
      `<h2>「${escapeHtml(work.title)}」${escapeHtml(phrase)}希望の声・みんなの評価</h2><ul>` +
      `<li>続編希望: ${sequel}票（登録ユーザー ${work.tally.registered.sequel} / 匿名 ${work.tally.anonymous.sequel}）</li>` +
      `<li>キレイに終わった: ${complete}票（登録ユーザー ${work.tally.registered.complete} / 匿名 ${work.tally.anonymous.complete}）</li></ul>` +
      rankLine +
      `<h2>作品データ</h2><ul>${facts}</ul>` +
      (official ? `<p><a href="${escapeHtml(official)}" rel="noopener" target="_blank">公式サイト</a></p>` : '') +
      series +
      (tagLinks ? `<h2>タグ</h2><ul>${tagLinks}</ul>` : '') +
      (threadsRes.data?.threads.length
        ? `<h2>「${escapeHtml(work.title)}」を語りたい人の掲示板</h2><ul>${threadsRes.data.threads
            .map((t) => `<li><a href="/threads/${t.id}">${escapeHtml(t.title)}</a>（${t.postCount}コメント）</li>`)
            .join('')}</ul>`
        : '') +
      seasonWorks,
  )

  return renderPage(env, request, {
    title: workPageTitle(work),
    description,
    canonical,
    // 検索エンジンに載せるのは、票・コメントのある作品、今期・前期の作品、人気作品だけ（バックエンドの indexableCond）。
    // 利用者が追加して、まだ管理者が承認していない作品も載せない（SEOスパム対策）
    noindex: !work.approved || work.indexable === false,
    ogType: work.media === 'movie' ? 'video.movie' : 'video.tv_show',
    ogImage,
    ogImageAlt: `${work.title}：続編希望${sequel}票・キレイに終わった${complete}票`,
    jsonLd,
    bodyHtml: body,
    initialData: { id: 'fv-initial-work', data: work },
  })
}
