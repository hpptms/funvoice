// /register  ユーザー登録（検索エンジンに載せない）
import { renderPage, siteOrigin, type Env } from '../edge/lib'

export const onRequestGet: PagesFunction<Env> = ({ request, env }) =>
  renderPage(env, request, { title: 'ユーザー登録', canonical: `${siteOrigin(env, request)}/register`, noindex: true })
