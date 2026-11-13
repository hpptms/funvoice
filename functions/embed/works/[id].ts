// /embed/works/:id  ブログ・感想サイトに iframe で貼る「続編希望 〇票［投票する］」のカード。
// - 他のサイトの iframe に表示できるよう、このパスだけ frame-ancestors を許可する（サイトの他のページは 'none' のまま）
// - スクリプトは一切入れない（CSP で禁止）。投票は作品ページを新しいタブで開いてしてもらう
// - 検索エンジンには載せない（作品ページが正）
import { escapeHtml, siteOrigin, type Env } from '../../../edge/lib'
import { apiGet } from '../../../edge/cache'

interface EmbedWork {
  id: number
  title: string
  sequelWord: string
  tally: { total: { sequel: number; complete: number } }
}

const HEADERS: Record<string, string> = {
  'Content-Type': 'text/html; charset=utf-8',
  'Content-Security-Policy':
    "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors *",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Robots-Tag': 'noindex',
  'Cache-Control': 'public, max-age=300',
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const { request, env, params } = ctx
  const id = String(params.id)
  const origin = siteOrigin(env, request)
  const { data } = /^[1-9]\d{0,17}$/.test(id) ? await apiGet<EmbedWork>(ctx, `/api/embed/works/${id}`) : { data: undefined }
  if (!data) {
    return new Response(page(`<p class="t"><a href="${origin}/" target="_blank" rel="noopener">FanVoice</a></p>`), {
      status: 404,
      headers: { ...HEADERS, 'Cache-Control': 'public, max-age=60' },
    })
  }
  const { sequel, complete } = data.tally.total
  const total = sequel + complete
  const pct = total ? Math.round((sequel / total) * 100) : 0
  const url = `${origin}/works/${data.id}`
  const body =
    `<a class="card" href="${escapeHtml(url)}" target="_blank" rel="noopener">` +
    `<span class="t">「${escapeHtml(data.title)}」${escapeHtml(data.sequelWord)}、見たい？</span>` +
    `<span class="bar" role="img" aria-label="続編希望 ${sequel}票、キレイに終わった ${complete}票">` +
    (total ? `<span class="s" style="width:${pct}%"></span><span class="c"></span>` : '') +
    `</span>` +
    `<span class="n"><span class="sq">続編希望 ${sequel}票</span><span class="cp">キレイに終わった ${complete}票</span></span>` +
    `<span class="f"><span class="b">投票する ›</span><span class="logo">FanVoice</span></span>` +
    `</a>`
  return new Response(page(body), { headers: HEADERS })
}

function page(body: string): string {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex"><title>FanVoice</title><style>
:root{color-scheme:light dark;--bg:#fff;--fg:#141414;--sub:#666;--line:#ddd;--p:#d9406c;--s:#2b78bf}
@media (prefers-color-scheme:dark){:root{--bg:#1c1c1c;--fg:#f2f2f2;--sub:#aaa;--line:#444}}
*{box-sizing:border-box}html,body{margin:0;background:transparent;font-family:system-ui,-apple-system,"Hiragino Sans","Noto Sans JP",sans-serif}
.card{display:flex;flex-direction:column;gap:6px;padding:12px 14px;border:1px solid var(--line);border-radius:10px;background:var(--bg);color:var(--fg);text-decoration:none;max-width:480px}
.card:hover .b{text-decoration:underline}
.t{font-weight:700;font-size:15px;line-height:1.4;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.bar{display:flex;height:10px;border-radius:99px;overflow:hidden;background:var(--line);gap:2px}
.s{background:var(--p)}.c{flex:1;background:var(--s)}
.n{display:flex;justify-content:space-between;font-size:12px;font-weight:700}.sq{color:var(--p)}.cp{color:var(--s)}
.f{display:flex;justify-content:space-between;align-items:center;font-size:13px}.b{color:var(--p);font-weight:700}.logo{color:var(--sub);font-size:12px}
</style></head><body>${body}</body></html>`
}
