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
