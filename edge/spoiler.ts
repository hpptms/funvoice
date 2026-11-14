/**
 * ネタバレ記法: 「#ネタバレ」（# は全角＃も可）から次の「#」までを隠す。
 * 閉じる # が無いときは本文の最後までを隠す（書き忘れでネタバレが漏れないように）。
 *
 * 例: 「最終回は #ネタバレ 主人公が〇〇 # でした」
 *      → 「最終回は 」「主人公が〇〇」（隠す）「 でした」
 *
 * バックエンドの抜粋処理（internal/api/spoiler.go）と同じ規則にすること。
 */
export type SpoilerSegment = { spoiler: false; text: string } | { spoiler: true; text: string }

const OPEN_RE = /[#＃]ネタバレ/g
const CLOSE_RE = /[#＃]/

export function splitSpoilers(body: string): SpoilerSegment[] {
  const out: SpoilerSegment[] = []
  let pos = 0
  OPEN_RE.lastIndex = 0
  for (;;) {
    OPEN_RE.lastIndex = pos
    const m = OPEN_RE.exec(body)
    if (!m) break
    if (m.index > pos) out.push({ spoiler: false, text: body.slice(pos, m.index) })
    const start = m.index + m[0].length
    const rest = body.slice(start)
    const c = CLOSE_RE.exec(rest)
    const end = c ? start + c.index : body.length
    out.push({ spoiler: true, text: trimEdges(body.slice(start, end)) })
    pos = c ? end + 1 : body.length
  }
  if (pos < body.length) out.push({ spoiler: false, text: body.slice(pos) })
  return out
}

/** マーカー直後・閉じ直前の空白/改行1つ分は見た目のために取り除く */
function trimEdges(s: string): string {
  return s.replace(/^[ 　]*\r?\n?/, '').replace(/\r?\n?[ 　]*$/, '')
}

export const SPOILER_PLACEHOLDER = '［ネタバレ］'

/** 抜粋・SEO用: 隠す部分を ［ネタバレ］ に置き換えた文字列 */
export function maskSpoilers(body: string): string {
  return splitSpoilers(body)
    .map((s) => (s.spoiler ? SPOILER_PLACEHOLDER : s.text))
    .join('')
}

/** 隠す部分を取り除いた文字列（画像・動画プレビューの対象を決めるため） */
export function stripSpoilers(body: string): string {
  return splitSpoilers(body)
    .map((s) => (s.spoiler ? ' ' : s.text))
    .join('')
}
