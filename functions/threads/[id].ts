// /threads/:id  掲示板のトピック。タイトル・説明文・構造化データ(DiscussionForumPosting)・コメント本文を埋め込む
import {
  apiGet,
  escapeHtml,
  renderPage,
  shellHtml,
  siteOrigin,
  type ApiPostPage,
  type ApiThread,
  type Env,
} from '../../edge/lib'
import { threadPageDescription, threadPageTitle } from '../../edge/seo'

export const onRequestGet: PagesFunction<Env> = async ({ request, env, params }) => {
  const id = String(params.id)
  const url = new URL(request.url)
  const origin = siteOrigin(env, request)
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1) || 1)
  const sort = url.searchParams.get('sort')
  const base = `${origin}/threads/${id}`
  const canonical = page > 1 ? `${base}?page=${page}` : base

  if (!/^[1-9]\d{0,17}$/.test(id)) {
    return renderPage(env, request, { title: 'ページが見つかりません', canonical: base, noindex: true, status: 404 })
  }

  const [threadRes, postsRes] = await Promise.all([
    apiGet<ApiThread>(env, request, `/api/threads/${id}`),
    apiGet<ApiPostPage>(env, request, `/api/threads/${id}/posts${page > 1 ? `?page=${page}` : ''}`),
  ])
  if (threadRes.status === 404) {
    return renderPage(env, request, { title: 'トピックが見つかりません', canonical: base, noindex: true, status: 404 })
  }
  const thread = threadRes.data
  if (!thread) {
    const res = await renderPage(env, request, { canonical, noindex: true, status: 503 })
    res.headers.set('Retry-After', '600')
    return res
  }
  const posts = postsRes.data?.posts ?? []
  const first = posts.find((p) => p.no === 1)

  const description = threadPageDescription(thread)

  // Google の「ディスカッション フォーラム」構造化データ
  const visible = posts.filter((p) => !p.deleted)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'DiscussionForumPosting',
        '@id': base,
        url: base,
        headline: thread.title,
        text: first && !first.deleted ? first.body : thread.excerpt,
        datePublished: thread.createdAt,
        dateModified: thread.lastPostedAt,
        author: { '@type': 'Person', name: first && !first.deleted ? first.name : '匿名' },
        about: { '@type': 'CreativeWork', name: thread.workTitle, url: `${origin}/works/${thread.workId}` },
        interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/CommentAction', userInteractionCount: thread.postCount },
        comment: visible
          .filter((p) => p.no !== 1)
          .slice(0, 50)
          .map((p) => ({
            '@type': 'Comment',
            url: `${base}${page > 1 ? `?page=${page}` : ''}#p${p.no}`,
            text: p.body,
            datePublished: p.createdAt,
            author: { '@type': 'Person', name: p.name },
            upvoteCount: p.plus,
            downvoteCount: p.minus,
          })),
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'FanVoice', item: `${origin}/` },
          { '@type': 'ListItem', position: 2, name: thread.workTitle, item: `${origin}/works/${thread.workId}` },
          { '@type': 'ListItem', position: 3, name: thread.title, item: base },
        ],
      },
    ],
  }

  const items = posts
    .map((p) =>
      p.deleted
        ? `<li id="p${p.no}">${p.no}. このコメントは削除されました</li>`
        : `<li id="p${p.no}"><p>${p.no}. ${escapeHtml(p.name)} ${escapeHtml(p.createdAt)} ＋${p.plus} －${p.minus}</p><p style="white-space:pre-wrap">${escapeHtml(p.body)}</p></li>`,
    )
    .join('')
  const body = shellHtml(
    `<p><a href="/works/${thread.workId}">${escapeHtml(thread.workTitle)}</a></p>` +
      `<h1>${escapeHtml(thread.title)}</h1><p>${thread.postCount}コメント</p><ol style="list-style:none;padding:0">${items}</ol>`,
  )

  return renderPage(env, request, {
    title: threadPageTitle(thread.title, thread.workTitle),
    description,
    canonical,
    // 並び替え表示は同じ内容の重複になるので索引させない
    noindex: !!sort && sort !== 'asc',
    ogType: 'article',
    jsonLd,
    bodyHtml: body,
    initialData: page === 1 && !sort && postsRes.data ? { id: 'fv-initial-thread', data: { thread, posts: postsRes.data } } : undefined,
  })
}
