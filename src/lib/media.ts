import { detectEmbed } from './embed'
import { parseYouTubeId } from './youtube'

/** 作品の紹介メディア（任意・どちらか一方）。画像はアップロードではなく外部の画像URL */
export type MediaChoice = { kind: 'none' } | { kind: 'youtube'; url: string } | { kind: 'image'; url: string }

/** 画像として表示できるURLか（https で、拡張子が png / jpg / gif / webp など） */
export const isImageUrl = (url: string) => detectEmbed(url)?.type === 'image'

/** 入力が投稿できる状態か（空欄はメディアなし扱い） */
export function isMediaValid(m: MediaChoice): boolean {
  if (m.kind === 'none' || m.url.trim() === '') return true
  return m.kind === 'youtube' ? !!parseYouTubeId(m.url) : isImageUrl(m.url)
}

/**
 * 紹介メディア（動画・画像）が無い作品に自動で表示する「参考画像がありません」の画像（Cloudinary に配置済み）。
 * 表示だけの代替なので、作品のデータ（youtubeId / imageUrl）は空のまま。
 */
const NO_MEDIA_BASE = 'https://res.cloudinary.com/zlutlhii/image/upload'
const NO_MEDIA_ID = 'v1794439187/fanvoice/static/no-reference-image'
/** 作品ページ用（長辺1600pxまで） */
export const NO_MEDIA_IMAGE = `${NO_MEDIA_BASE}/c_limit,w_1600,h_1600,q_auto,f_webp/${NO_MEDIA_ID}`
/** 一覧カード用（16:9 の 480x270） */
export const NO_MEDIA_THUMB = `${NO_MEDIA_BASE}/c_fill,w_480,h_270,q_auto,f_webp/${NO_MEDIA_ID}`
