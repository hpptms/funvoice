import { renderPage, shellHtml, siteOrigin, type Env } from '../edge/lib'

export const onRequestGet: PagesFunction<Env> = ({ request, env }) =>
  renderPage(env, request, {
    title: 'お問い合わせ',
    description: 'FanVoiceへのお問い合わせ、著作権侵害などの削除依頼はこちらから。',
    canonical: `${siteOrigin(env, request)}/contact`,
    bodyHtml: shellHtml('<h1>お問い合わせ</h1><p>お問い合わせ・削除依頼のフォームです。</p>'),
  })
