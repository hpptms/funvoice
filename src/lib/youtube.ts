// YouTube の動画URLから動画ID（11文字）を取り出す（サーバー側 parseYouTubeID と同じ判定）。
// 埋め込みは動画IDから決まった形のURLを組み立てるだけにして、任意のURLを埋め込ませない。
const ID_RE = /^[A-Za-z0-9_-]{11}$/

export function parseYouTubeId(raw: string): string | null {
  let u: URL
  try {
    u = new URL(raw.trim())
  } catch {
    return null
  }
  if (u.protocol !== 'https:' && u.protocol !== 'http:') return null
  const host = u.hostname.toLowerCase().replace(/^www\./, '')
  const parts = u.pathname.replace(/^\/+|\/+$/g, '').split('/')
  let id: string | null = null
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
    if (parts.length === 1 && parts[0] === 'watch') id = u.searchParams.get('v')
    else if (parts.length === 2 && ['shorts', 'embed', 'live'].includes(parts[0])) id = parts[1]
  } else if (host === 'youtube-nocookie.com') {
    if (parts.length === 2 && parts[0] === 'embed') id = parts[1]
  } else if (host === 'youtu.be') {
    if (parts.length === 1) id = parts[0]
  }
  return id && ID_RE.test(id) ? id : null
}

/** サムネイル画像（i.ytimg.com、480x360・上下に黒帯あり） */
export const youtubeThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
/** 一覧のカード用サムネイル（320x180、16:9 で黒帯なし） */
export const youtubeCardThumbnail = (id: string) => `https://i.ytimg.com/vi/${id}/mqdefault.jpg`
/** 埋め込みプレーヤー（Cookie を使わない youtube-nocookie.com） */
export const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
