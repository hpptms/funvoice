// /tags/123  タグ別のアニメ一覧（原作・掲載誌・ジャンルなど）。放送時期タグは /season/… へ転送する
import { siteOrigin, type ApiTag, type Env } from '../../edge/lib'
import { apiGet } from '../../edge/cache'
import { notFoundTag, renderTagPage } from '../../edge/tagPage'
import { tagPath } from '../../edge/seo'

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { request, env, params } = ctx
  const id = String(params.id)
  const origin = siteOrigin(env, request)
  if (!/^[1-9]\d{0,17}$/.test(id)) return notFoundTag(env, request, `${origin}/tags`)
  const { status, data: tag } = await apiGet<ApiTag>(ctx, `/api/tags/${id}`)
  if (status === 404 || (!tag && status < 500)) return notFoundTag(env, request, `${origin}/tags/${id}`)
  if (!tag) return new Response('Service Unavailable', { status: 503, headers: { 'Retry-After': '600' } })
  const path = tagPath(tag)
  if (path !== `/tags/${id}`) return Response.redirect(`${origin}${path}${new URL(request.url).search}`, 301)
  return renderTagPage(ctx, tag)
}
