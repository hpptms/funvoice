import { describe, expect, it } from 'vitest'
import { rewriteCollectUrl } from './collectRewrite'

const base = 'https://funvoice.jp/k'

describe('rewriteCollectUrl', () => {
  it('GA4 の送信URLを、ブロックリストに当たらない形に書き換える', () => {
    const q = 'v=2&tid=G-4FS7F801NF&en=page_view&dt=%E3%81%82'
    const out = rewriteCollectUrl(`${base}/g/collect?${q}`, base)!
    expect(out).toMatch(/^https:\/\/funvoice\.jp\/k\/[A-Za-z0-9_-]+$/)
    expect(out).not.toContain('collect')
    expect(out).not.toContain('tid=')
    const d = out.slice(base.length + 1).replace(/-/g, '+').replace(/_/g, '/')
    expect(atob(d)).toBe(q)
  })

  it('それ以外の通信は書き換えない', () => {
    expect(rewriteCollectUrl('https://funvoice.jp/api/works', base)).toBeNull()
    expect(rewriteCollectUrl('https://region1.google-analytics.com/g/collect?v=2', base)).toBeNull()
  })
})
