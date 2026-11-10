// /season/2026-autumn（年だけは /season/2026）  放送時期別のアニメ一覧
import { siteOrigin, type Env } from '../../edge/lib'
import { findSeasonTag, notFoundTag, renderTagPage } from '../../edge/tagPage'
import { seasonLabelFromSlug } from '../../edge/seo'

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { request, env, params } = ctx
  const slug = String(params.slug)
  const canonical = `${siteOrigin(env, request)}/season/${encodeURIComponent(slug)}`
  const label = seasonLabelFromSlug(slug)
  const tag = label ? await findSeasonTag(ctx, label) : undefined
  if (!tag) return notFoundTag(env, request, canonical)
  return renderTagPage(ctx, tag)
}
