// /admin  管理画面は検索エンジンに載せない
import { renderPage, siteOrigin, type Env } from '../edge/lib'

export const onRequestGet: PagesFunction<Env> = ({ request, env }) =>
  renderPage(env, request, { title: '管理', canonical: `${siteOrigin(env, request)}/admin`, noindex: true })
