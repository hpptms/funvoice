import { describe, expect, it } from 'vitest'
import { detectEmbed, findEmbeds } from './embed'

describe('detectEmbed', () => {
  it.each([
    ['https://example.com/a/cat.png', 'image'],
    ['https://example.com/a/cat.JPG?w=100', 'image'],
    ['https://example.com/cat.jpeg', 'image'],
    ['https://example.com/anim.gif', 'image'],
    ['https://example.com/pic.webp#x', 'image'],
    ['https://pbs.twimg.com/media/AbCdEf?format=jpg&name=small', 'image'],
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube'],
    ['https://youtu.be/dQw4w9WgXcQ', 'youtube'],
    ['https://www.youtube.com/shorts/dQw4w9WgXcQ', 'youtube'],
    ['https://vimeo.com/76979871', 'vimeo'],
    ['https://player.vimeo.com/video/76979871', 'vimeo'],
    ['https://www.nicovideo.jp/watch/sm9', 'niconico'],
    ['https://sp.nicovideo.jp/watch/sm9', 'niconico'],
    ['https://nico.ms/sm9', 'niconico'],
    ['https://example.com/movie.mp4', 'video'],
    ['https://example.com/clip.webm', 'video'],
  ])('%s → %s', (url, type) => {
    expect(detectEmbed(url)?.type).toBe(type)
  })

  it.each([
    'http://example.com/cat.png', // http は対象外（混在コンテンツ）
    'javascript:alert(1)//x.png',
    'data:image/png;base64,AAAA',
    'https://example.com/cat.svg', // SVG は表示しない
    'https://example.com/cat.png.html',
    'https://example.com/page',
    'https://vimeo.com/channels/staffpicks',
    'https://www.nicovideo.jp/user/123',
    'https://pbs.twimg.com/profile_images/x.png.html',
    'https://evil.example/watch?v=dQw4w9WgXcQ',
  ])('対象外: %s', (url) => {
    expect(detectEmbed(url)).toBeNull()
  })
})

describe('findEmbeds', () => {
  it('本文から画像・動画を取り出す（重複は1つ・最大4件）', () => {
    const body = [
      '見て https://example.com/a.png と https://youtu.be/dQw4w9WgXcQ',
      'もう一回 https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      'https://example.com/b.jpg https://example.com/c.gif https://example.com/d.webp https://example.com/e.png',
      'ふつうのリンク https://example.com/page',
    ].join('\n')
    const embeds = findEmbeds(body)
    expect(embeds.map((e) => e.type)).toEqual(['image', 'youtube', 'image', 'image'])
    expect(embeds).toHaveLength(4)
  })

  it('URLが無ければ空', () => {
    expect(findEmbeds('画像はこちら（URLなし）')).toHaveLength(0)
  })

  it('HTMLタグの中のURLも「URL」としてだけ扱う（タグ自体は使わない）', () => {
    expect(findEmbeds('<img src=https://example.com/a.png onerror=alert(1)>')).toEqual([{ type: 'image', url: 'https://example.com/a.png' }])
  })
})
