import { describe, expect, it } from 'vitest'
import { currentSeasonName, isOnAir, seasonNameLabel, seasonValueLabel, toSeasonInput } from './season'

describe('放送時期', () => {
  it('年＋季節 / 年だけ / 不明 / 未設定', () => {
    expect(toSeasonInput({ year: 2026, season: 'autumn' })).toEqual({ seasonYear: 2026, season: 'autumn' })
    expect(toSeasonInput({ year: 2026, season: '' })).toEqual({ seasonYear: 2026 })
    expect(toSeasonInput({ year: 'unknown', season: '' })).toEqual({ season: 'unknown' })
    expect(toSeasonInput({ year: '', season: '' })).toBeNull()
    expect(seasonValueLabel({ year: 2026, season: 'autumn' })).toBe('2026年秋')
    expect(seasonValueLabel({ year: 2026, season: '' })).toBe('2026年')
    expect(seasonValueLabel({ year: 'unknown', season: '' })).toBe('放送時期不明')
  })
  it('works.season_name からタグ名', () => {
    expect(seasonNameLabel('2026-autumn')).toBe('2026年秋')
    expect(seasonNameLabel('2026')).toBe('2026年')
    expect(seasonNameLabel('unknown')).toBe('放送時期不明')
    expect(seasonNameLabel('')).toBeNull()
  })
  it('今期（日本時間で切り替え）', () => {
    expect(currentSeasonName(new Date('2026-11-12T12:00:00+09:00'))).toBe('2026-autumn')
    expect(currentSeasonName(new Date('2026-12-31T23:59:59+09:00'))).toBe('2026-autumn')
    // UTC ではまだ12月31日でも、日本時間で1月1日なら翌年の冬
    expect(currentSeasonName(new Date('2027-01-01T00:00:00+09:00'))).toBe('2027-winter')
    expect(currentSeasonName(new Date('2027-04-01T00:00:00+09:00'))).toBe('2027-spring')
    expect(currentSeasonName(new Date('2027-07-15T00:00:00+09:00'))).toBe('2027-summer')
    const now = new Date('2026-11-12T12:00:00+09:00')
    expect(isOnAir('2026-autumn', now)).toBe(true)
    expect(isOnAir('2026-summer', now)).toBe(false)
    expect(isOnAir('2026', now)).toBe(false)
    expect(isOnAir('', now)).toBe(false)
  })
})
