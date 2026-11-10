// /mypage  マイページ（検索エンジンに載せない）
import { renderPage, siteOrigin, type Env } from '../edge/lib'

export const onRequestGet: PagesFunction<Env> = ({ request, env }) =>
  renderPage(env, request, { title: 'マイページ', canonical: `${siteOrigin(env, request)}/mypage`, noindex: true })
