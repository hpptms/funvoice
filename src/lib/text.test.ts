import { describe, expect, it } from 'vitest'
import { safeHttpUrl, tokenize } from './text'

describe('safeHttpUrl', () => {
  it.each([
    ['https://example.com/a?b=1', 'https://example.com/a?b=1'],
    ['  http://example.com ', 'http://example.com/'],
  ])('http(s) は許可: %s', (input, want) => {
    expect(safeHttpUrl(input)).toBe(want)
  })

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    '//evil.example.com',
    '/relative/path',
    'https://',
    '',
    null,
    undefined,
  ])('それ以外は拒否: %s', (input) => {
    expect(safeHttpUrl(input)).toBeNull()
  })
})

describe('tokenize', () => {
  it('HTMLタグはただの文字として扱う', () => {
    const body = '<script>alert(1)</script><img src=x onerror=alert(1)>'
    expect(tokenize(body)).toEqual([{ type: 'text', value: body }])
  })

  it('javascript: はリンクにしない', () => {
    const tokens = tokenize('ここ javascript:alert(1) を見て')
    expect(tokens.every((t) => t.type === 'text')).toBe(true)
  })

  it('http(s) のURLはリンクにする', () => {
    expect(tokenize('公式 https://example.com/news?id=1 だよ')).toEqual([
      { type: 'text', value: '公式 ' },
      { type: 'url', value: 'https://example.com/news?id=1', href: 'https://example.com/news?id=1' },
      { type: 'text', value: ' だよ' },
    ])
  })

  it('URLの直後の日本語の句読点・括弧はリンクに含めない', () => {
    const t = tokenize('見て→https://example.com/a。（https://example.com/b）')
    expect(t.filter((x) => x.type === 'url').map((x) => x.value)).toEqual(['https://example.com/a', 'https://example.com/b'])
  })

  it('URL末尾のピリオド・閉じ括弧は外す（URL内の対応する括弧は残す）', () => {
    const t = tokenize('(https://example.com/x). と https://en.wikipedia.org/wiki/Foo_(bar)')
    expect(t.filter((x) => x.type === 'url').map((x) => x.value)).toEqual([
      'https://example.com/x',
      'https://en.wikipedia.org/wiki/Foo_(bar)',
    ])
  })

  it('引用符や山括弧でURLを打ち切る（属性への埋め込み攻撃の防止）', () => {
    const t = tokenize('https://example.com/"onmouseover="alert(1) https://example.com/<b>')
    const urls = t.filter((x) => x.type === 'url').map((x) => x.value)
    expect(urls).toEqual(['https://example.com/', 'https://example.com/'])
    expect(t.map((x) => x.value).join('')).toBe('https://example.com/"onmouseover="alert(1) https://example.com/<b>')
  })

  it('>>番号（全角も）をアンカーにする', () => {
    expect(tokenize('>>12 ＞＞３ ≫4')).toEqual([
      { type: 'anchor', value: '>>12', no: 12 },
      { type: 'text', value: ' ' },
      { type: 'anchor', value: '＞＞３', no: 3 },
      { type: 'text', value: ' ' },
      { type: 'anchor', value: '≫4', no: 4 },
    ])
  })

  it('元の文字列を欠けなく再現できる', () => {
    const body = 'a >>1 https://example.com/x。\n<b>b</b> ＞＞２'
    expect(tokenize(body).map((t) => t.value).join('')).toBe(body)
  })
})
