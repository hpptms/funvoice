/**
 * レトロ表示のフォント（DotGothic16・M PLUS 1 Code）の読み込み方。
 *
 * 日本語フォントは文字範囲ごとに約120ファイルに分かれており、1ページで40〜90ファイル（合計700KB前後）を取りに行く。
 * font-display: optional なので、初めて来た人はフォントが間に合わずシステムのフォントで表示されるのに、
 * その通信が JS・画像と回線を取り合い、スマホの表示（LCP）を数秒遅らせていた。そこで
 *  - 初回：フォントのCSSは読み込まない。表示が終わって手が空いてから、そのページで使っている文字の分だけ
 *    フォントをブラウザのキャッシュに先読みする（画面には適用しないので、表示中に文字が切り替わってずれることはない）
 *  - 2回目以降：キャッシュ済みなので、描画前にCSSを読み込んで最初からフォントで表示する
 */
import { afterPageLoad } from '../lib/afterPageLoad'

const CACHED_KEY = 'fv_fonts_cached'

function isCached(): boolean {
  try {
    return localStorage.getItem(CACHED_KEY) === '1'
  } catch {
    return false
  }
}

let applying: Promise<unknown> | undefined

/** フォントのCSSを読み込んで画面に適用する（何度呼んでも1回だけ） */
export function applyFonts(): Promise<unknown> {
  return (applying ??= import('./apply').catch(() => null))
}

/**
 * 起動時に呼ぶ。キャッシュ済みならフォントを適用し（描画前に待つための Promise を返す）、
 * まだなら表示後にキャッシュへ先読みだけしておく
 */
export function setupFonts(retro: boolean): Promise<unknown> {
  if (!retro) return Promise.resolve()
  if (isCached()) return applyFonts()
  afterPageLoad(() => {
    import('./warmup')
      .then((m) => m.warmFonts())
      .then(() => {
        try {
          localStorage.setItem(CACHED_KEY, '1')
        } catch {
          /* 保存できなければ次回も先読みからやり直すだけ */
        }
      })
      .catch(() => {})
  })
  return Promise.resolve()
}
