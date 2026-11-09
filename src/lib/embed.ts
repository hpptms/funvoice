import { safeHttpUrl, tokenize } from './text'
import { parseYouTubeId } from './youtube'

/**
 * コメント本文に貼られたURLから、表示できる画像・動画を見分ける。
 *
 * 判定はURLの形（拡張子・動画サイトのアドレス）だけで行い、サーバーからURL先を見に行くことはしない
 * （サーバーに任意のURLを取得させると、内部ネットワークへのアクセスなどに悪用されるおそれがあるため）。
 * https のURLだけを対象にする。
 */
export type Embed =
  | { type: 'image'; url: string }
  | { type: 'youtube'; id: string; url: string }
  | { type: 'vimeo'; id: string; url: string }
  | { type: 'niconico'; id: string; url: string }
  | { type: 'video'; url: string }

/** 1コメントで表示する画像・動画の上限 */
export const MAX_EMBEDS = 4

const IMAGE_EXT = /\.(png|jpe?g|gif|webp)$/i
const VIDEO_EXT = /\.(mp4|webm|mov|m4v)$/i

export function detectEmbed(raw: string): Embed | null {
  const href = safeHttpUrl(raw)
  if (!href) return null
  const u = new URL(href)
  if (u.protocol !== 'https:') return null // http の画像・動画は混在コンテンツになるので表示しない

  const youtube = parseYouTubeId(href)
  if (youtube) return { type: 'youtube', id: youtube, url: href }

  const host = u.hostname.toLowerCase().replace(/^www\./, '')
  const path = u.pathname

  // Vimeo: vimeo.com/123456 / player.vimeo.com/video/123456
  let m = host === 'vimeo.com' ? /^\/(\d{1,12})\/?$/.exec(path) : host === 'player.vimeo.com' ? /^\/video\/(\d{1,12})\/?$/.exec(path) : null
  if (m) return { type: 'vimeo', id: m[1], url: href }

  // ニコニコ動画: nicovideo.jp/watch/sm123 / sp.nicovideo.jp/watch/sm123 / nico.ms/sm123
  m =
    host === 'nicovideo.jp' || host === 'sp.nicovideo.jp'
      ? /^\/watch\/((?:sm|so|nm)\d{1,12})\/?$/.exec(path)
      : host === 'nico.ms'
        ? /^\/((?:sm|so|nm)\d{1,12})\/?$/.exec(path)
        : null
  if (m) return { type: 'niconico', id: m[1], url: href }

  if (IMAGE_EXT.test(path)) return { type: 'image', url: href }
  // X(Twitter) の画像: pbs.twimg.com/media/xxx?format=jpg
  if (host === 'pbs.twimg.com' && path.startsWith('/media/') && /^(png|jpg|jpeg|webp)$/i.test(u.searchParams.get('format') ?? '')) {
    return { type: 'image', url: href }
  }
  if (VIDEO_EXT.test(path)) return { type: 'video', url: href }
  return null
}

/** 本文中のURLから表示する画像・動画を取り出す（重複は1つに、最大 MAX_EMBEDS 件） */
export function findEmbeds(body: string): Embed[] {
  const out: Embed[] = []
  const seen = new Set<string>()
  for (const t of tokenize(body)) {
    if (t.type !== 'url') continue
    const e = detectEmbed(t.href)
    const key = e && ('id' in e ? `${e.type}:${e.id}` : e.url)
    if (!e || !key || seen.has(key)) continue
    seen.add(key)
    out.push(e)
    if (out.length === MAX_EMBEDS) break
  }
  return out
}

export const vimeoPlayerUrl = (id: string) => `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`
export const niconicoPlayerUrl = (id: string) => `https://embed.nicovideo.jp/watch/${id}?autoplay=1`
