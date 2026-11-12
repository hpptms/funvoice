import { describe, expect, it } from 'vitest'
import {
  broadcastDateIso,
  broadcastDateLabel,
  castSummary,
  recentSeasonNames,
  rankingTitle,
  seasonLabelFromSlug,
  seasonSlug,
  sequelWord,
  tagPath,
  workPageTitle,
  normalizeOgQuery,
  yearsSinceSeason,
} from '../../edge/seo'

describe('放送時期のURL', () => {
  it('タグ名とURLを相互に変換する', () => {
    expect(seasonSlug('2026年秋')).toBe('2026-autumn')
    expect(seasonSlug('2004年')).toBe('2004')
    expect(seasonSlug('放送時期不明')).toBeNull()
    expect(seasonLabelFromSlug('2026-autumn')).toBe('2026年秋')
    expect(seasonLabelFromSlug('2004')).toBe('2004年')
    expect(seasonLabelFromSlug('2026-fall')).toBeNull()
    expect(seasonLabelFromSlug('../etc')).toBeNull()
  })
  it('放送時期タグは /season/、それ以外は /tags/', () => {
    expect(tagPath({ id: 5, name: '2026年冬', kind: 'season' })).toBe('/season/2026-winter')
    expect(tagPath({ id: 6, name: '放送時期不明', kind: 'season' })).toBe('/tags/6')
    expect(tagPath({ id: 7, name: '少年ジャンプ', kind: 'source' })).toBe('/tags/7')
  })
})

describe('作品ページの文言', () => {
  // バックエンドの TestSequelWord と同じ例
  it.each([
    ['サムライ7', 'tv', '2期'],
    ['ぼっち・ざ・ろっく！', 'web', '2期'],
    ['進撃の巨人 Season 2', 'tv', '続編'],
    ['ダンジョン飯 第2期', 'tv', '続編'],
    ['Re:ゼロから始める異世界生活 2nd season', 'tv', '続編'],
    ['続・終物語', 'tv', '続編'],
    ['化物語 Part 2', 'tv', '続編'],
    ['ストライク・ザ・ブラッド II', 'ova', '続編'],
    ['魔法少女リリカルなのは A\'s II', 'tv', '続編'],
    ['Hawaii Five', 'tv', '2期'],
    ['君の名は。', 'movie', '続編'],
  ])('%s (%s) → %s', (title, media, want) => {
    expect(sequelWord(title, media)).toBe(want)
  })
  it('タイトルに「2期」と票数を入れる', () => {
    expect(workPageTitle({ title: 'サムライ7', media: 'tv', tally: { total: { sequel: 0, complete: 0 } } })).toBe(
      'サムライ7 2期（続編）希望の声｜みんなの評価と掲示板',
    )
    expect(workPageTitle({ title: '君の名は。', media: 'movie', tally: { total: { sequel: 12, complete: 3 } } })).toBe(
      '君の名は。 続編希望の声｜続編希望12票・みんなの評価',
    )
  })
  it('放送からの年数', () => {
    const now = new Date('2026-11-10T00:00:00Z')
    expect(yearsSinceSeason('2004-spring', now)).toBe(22)
    expect(yearsSinceSeason('2026-summer', now)).toBeNull()
    expect(yearsSinceSeason('unknown', now)).toBeNull()
  })
})

describe('ランキング', () => {
  it('バックエンドの RankingTitle と同じ見出し', () => {
    expect(rankingTitle('sequel')).toBe('2期が見たいアニメランキング')
    expect(rankingTitle('complete')).toBe('キレイに終わったアニメランキング')
    expect(rankingTitle('sequel', '2026-autumn')).toBe('2026年秋アニメ 続編希望ランキング')
    expect(rankingTitle('complete', '2025-winter')).toBe('2025年冬アニメ キレイに終わったランキング')
  })
  it('直近のシーズン（日本時間）', () => {
    expect(recentSeasonNames(3, new Date('2026-11-10T00:00:00Z'))).toEqual(['2026-autumn', '2026-summer', '2026-spring'])
    expect(recentSeasonNames(2, new Date('2025-12-31T16:00:00Z'))).toEqual(['2026-winter', '2025-autumn'])
  })
})

describe('SNS共有用の画像URL', () => {
  it('v などの余分なクエリはキャッシュのキーから外す', () => {
    expect(normalizeOgQuery('/api/og/works/21.png?v=3-2')).toBe('/api/og/works/21.png')
    expect(normalizeOgQuery('/api/og/works/21.png?v=1&x=2')).toBe('/api/og/works/21.png')
    expect(normalizeOgQuery('/api/og/rankings/sequel.png?season=2026-autumn&v=9')).toBe('/api/og/rankings/sequel.png?season=2026-autumn')
    expect(normalizeOgQuery('/api/og/rankings/sequel.png?season=evil')).toBe('/api/og/rankings/sequel.png')
    expect(normalizeOgQuery('/api/works?tag=1')).toBe('/api/works?tag=1')
  })
})

describe('キャスト・放送日', () => {
  it('説明文用に声優を重複なく2人まで並べる', () => {
    const cast = [
      { character: '猫猫', name: '悠木碧' },
      { character: '猫猫（幼少期）', name: '悠木碧' },
      { character: '壬氏', name: '大塚剛央' },
      { character: '高順', name: '小西克幸' },
    ]
    expect(castSummary(cast)).toBe('出演 悠木碧、大塚剛央')
    expect(castSummary([])).toBe('')
  })
  it('日本時間の RFC3339 から日付を取り出す', () => {
    expect(broadcastDateLabel('2026-10-02T23:00:00+09:00')).toBe('2026年10月2日')
    expect(broadcastDateIso('2026-10-02T23:00:00+09:00')).toBe('2026-10-02')
    expect(broadcastDateLabel(undefined)).toBe('')
    expect(broadcastDateIso('<script>')).toBe('')
  })
})
