// フォントをブラウザのキャッシュに先読みする（画面には適用しない）。
// ?inline でCSSを文字列として受け取り、@font-face ごとに「このページの文字が含まれる範囲か」を見て、必要なファイルだけ取りに行く
import dot400 from '@fontsource/dotgothic16/400.css?inline'
import mono400 from '@fontsource/m-plus-1-code/400.css?inline'
import mono700 from '@fontsource/m-plus-1-code/700.css?inline'

interface Face {
  family: string
  weight: string
  url: string
  ranges: [number, number][]
}

function parseRanges(src: string): [number, number][] {
  return src.split(',').flatMap((part) => {
    const m = /U\+([0-9a-f?]+)(?:-([0-9a-f]+))?/i.exec(part.trim())
    if (!m) return []
    // U+4?? のようなワイルドカードは 4000-4fff の範囲として扱う
    const lo = parseInt(m[1].replace(/\?/g, '0'), 16)
    const hi = parseInt(m[2] ?? m[1].replace(/\?/g, 'f'), 16)
    return [[lo, hi] as [number, number]]
  })
}

export function parseFaces(css: string): Face[] {
  const faces: Face[] = []
  for (const block of css.match(/@font-face\s*{[^}]*}/g) ?? []) {
    // 圧縮後のCSSは最後の宣言の ; が省かれ } で終わるので、どちらでも区切る
    const family = /font-family:\s*['"]?([^;}'"]+)['"]?\s*[;}]/.exec(block)?.[1]?.trim()
    const weight = /font-weight:\s*([^;}]+)/.exec(block)?.[1]?.trim() ?? '400'
    const url = /url\(\s*['"]?([^'")]+\.woff2)['"]?\s*\)/.exec(block)?.[1]
    const range = /unicode-range:\s*([^;}]+)/.exec(block)?.[1]
    if (!family || !url) continue
    faces.push({ family, weight, url, ranges: range ? parseRanges(range) : [[0, 0x10ffff]] })
  }
  return faces
}

export function usedFaces(faces: Face[], text: string): Face[] {
  const codes = new Set<number>()
  for (const ch of text) codes.add(ch.codePointAt(0)!)
  const sorted = [...codes].sort((a, b) => a - b)
  return faces.filter((f) => f.ranges.some(([lo, hi]) => sorted.some((c) => c >= lo && c <= hi)))
}

export async function warmFonts(): Promise<void> {
  if (typeof FontFace === 'undefined') return
  const faces = usedFaces(parseFaces(dot400 + mono400 + mono700), document.title + document.body.innerText)
  // document.fonts に追加しないので画面には使われず、取得したファイルが HTTP キャッシュに残るだけ
  await Promise.allSettled(
    faces.map((f) => new FontFace(f.family, `url(${f.url}) format('woff2')`, { weight: f.weight }).load()),
  )
}
