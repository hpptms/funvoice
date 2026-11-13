// /notifications  通知（検索エンジンに載せない）
import { renderPage, siteOrigin, type Env } from '../edge/lib'

export const onRequestGet: PagesFunction<Env> = ({ request, env }) =>
  renderPage(env, request, { title: '通知', canonical: `${siteOrigin(env, request)}/notifications`, noindex: true })
