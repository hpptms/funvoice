// /works/:id  作品ページ。タイトル・説明文・OGP・構造化データ・本文をHTMLに埋め込む
import { escapeHtml, renderPage, safeUrl, shellHtml, siteOrigin, type ApiWork, type Env } from '../../edge/lib'
import { apiGet } from '../../edge/cache'
import { workPageDescription, workPageTitle } from '../../edge/seo'

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

  const sameAs = [safeUrl(work.officialSiteUrl), safeUrl(work.wikipediaUrl)].filter(Boolean)
  // SNS で共有したときの画像。外部の画像URLならそのまま、以前のアップロード画像は Cloudinary に JPEG で配信させる
  const ogImage = work.imageUrl && /^https:\/\//.test(work.imageUrl)
    ? work.imageUrl
    : work.image
    ? work.image.fullUrl.replace('f_webp,fl_awebp', 'f_jpg')
    : work.youtubeId && /^[A-Za-z0-9_-]{11}$/.test(work.youtubeId)
      ? `https://i.ytimg.com/vi/${work.youtubeId}/hqdefault.jpg`
      : undefined
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': work.media === 'movie' ? 'Movie' : 'TVSeries',
        name: work.title,
        url: canonical,
        description,
        ...(sameAs.length ? { sameAs } : {}),
        ...(ogImage ? { image: ogImage } : {}),
        ...(work.media !== 'movie' && work.episodesCount > 0 ? { numberOfEpisodes: work.episodesCount } : {}),
        genre: work.tags.filter((t) => t.kind === 'genre').map((t) => t.name),
        keywords: work.tags.map((t) => t.name).join(','),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'FanVoice', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: work.title, item: canonical },
        ],
      },
    ],
  }

  const tagLinks = work.tags.map((t) => `<li><a href="/?tag=${t.id}">#${escapeHtml(t.name)}</a></li>`).join('')
  const official = safeUrl(work.officialSiteUrl)
  const body = shellHtml(
    `<h1>${escapeHtml(work.title)}</h1>` +
      `<p>${escapeHtml(description)}</p>` +
      `<h2>みんなの評価</h2><ul>` +
      `<li>続編希望: ${sequel}票（登録ユーザー ${work.tally.registered.sequel} / 匿名 ${work.tally.anonymous.sequel}）</li>` +
      `<li>キレイに終わった: ${complete}票（登録ユーザー ${work.tally.registered.complete} / 匿名 ${work.tally.anonymous.complete}）</li></ul>` +
      (tagLinks ? `<h2>タグ</h2><ul>${tagLinks}</ul>` : '') +
      (official ? `<p><a href="${escapeHtml(official)}" rel="noopener" target="_blank">公式サイト</a></p>` : '') +
      (threadsRes.data?.threads.length
        ? `<h2>「${escapeHtml(work.title)}」を語りたい人の掲示板</h2><ul>${threadsRes.data.threads
            .map((t) => `<li><a href="/threads/${t.id}">${escapeHtml(t.title)}</a>（${t.postCount}コメント）</li>`)
            .join('')}</ul>`
        : ''),
  )

  return renderPage(env, request, {
    title: workPageTitle(work.title),
    description,
    canonical,
    // 利用者が追加して、まだ管理者が承認していない作品は検索エンジンに載せない（SEOスパム対策）
    noindex: !work.approved,
    ogType: work.media === 'movie' ? 'video.movie' : 'video.tv_show',
    ogImage,
    jsonLd,
    bodyHtml: body,
    initialData: { id: 'fv-initial-work', data: work },
  })
}
