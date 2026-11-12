import { describe, expect, it } from 'vitest'
import { parseFaces, usedFaces } from './warmup'

const css = `@font-face{font-family:'DotGothic16';font-weight:400;src:url(/assets/a.woff2) format('woff2');unicode-range:U+4e00-4e1f,U+3042;}
@font-face{font-family:"M PLUS 1 Code";font-weight:700;src:url(/assets/b.woff2)format("woff2");unicode-range:U+0000-00ff;}
@font-face{font-family:X;src:url(/assets/c.woff2);unicode-range:U+30??}`

describe('parseFaces', () => {
  it('@font-face ごとに名前・太さ・URL・文字範囲を取り出す', () => {
    const faces = parseFaces(css)
    expect(faces.map((f) => [f.family, f.weight, f.url])).toEqual([
      ['DotGothic16', '400', '/assets/a.woff2'],
      ['M PLUS 1 Code', '700', '/assets/b.woff2'],
      ['X', '400', '/assets/c.woff2'],
    ])
    expect(faces[0].ranges).toEqual([[0x4e00, 0x4e1f], [0x3042, 0x3042]])
    expect(faces[2].ranges).toEqual([[0x3000, 0x30ff]])
  })
})

describe('usedFaces', () => {
  it('ページの文字が含まれる範囲のフォントだけを選ぶ', () => {
    const faces = parseFaces(css)
    expect(usedFaces(faces, 'あ').map((f) => f.url)).toEqual(['/assets/a.woff2', '/assets/c.woff2'])
    expect(usedFaces(faces, 'abc').map((f) => f.url)).toEqual(['/assets/b.woff2'])
    expect(usedFaces(faces, '😀')).toEqual([])
  })
})
