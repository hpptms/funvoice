import type { Post } from '../api/client'

/** プラスが10以上かつマイナスの2倍以上なら「人気コメント」として強調する */
export function isPopular(p: Pick<Post, 'plus' | 'minus' | 'deleted'>): boolean {
  return !p.deleted && p.plus >= 10 && p.plus >= p.minus * 2
}

const NAME_KEY = 'fv_name'

/** 名前欄の入力を次回も使えるよう、この端末にだけ保存する */
export function loadSavedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function saveName(name: string) {
  try {
    if (name) localStorage.setItem(NAME_KEY, name)
    else localStorage.removeItem(NAME_KEY)
  } catch {
    /* 保存できなくても投稿はできる */
  }
}
