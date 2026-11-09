import { siteOrigin, type Env } from '../edge/lib'

export const onRequestGet: PagesFunction<Env> = ({ request, env }) => {
  const origin = siteOrigin(env, request)
  // /api は禁止しない（検索エンジンがJSを実行して描画するときにAPIを読む必要があるため）
  const body = ['User-agent: *', 'Allow: /', 'Disallow: /admin', '', `Sitemap: ${origin}/sitemap.xml`, ''].join('\n')
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=86400' },
  })
}
