import { describe, expect, it } from 'vitest'
import { seasonNameLabel, seasonValueLabel, toSeasonInput } from './season'

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
})
