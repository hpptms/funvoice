import { SEASON_LABEL, type Season, type SeasonInput } from '../api/client'
import { currentSeasonName } from '../../edge/seo'

export { currentSeasonName }

/** 放送時期の選択欄の値。year: '' = 未設定 / 'unknown' = 不明 / 数値 = 年。season: '' = 未選択 */
export type SeasonValue = { year: number | '' | 'unknown'; season: Season | '' }

export const EMPTY_SEASON: SeasonValue = { year: '', season: '' }

/** 選択欄の値を API に送る形にする（未設定なら null） */
export function toSeasonInput(v: SeasonValue): SeasonInput | null {
  if (v.year === 'unknown') return { season: 'unknown' }
  if (v.year === '') return null
  return v.season ? { seasonYear: v.year, season: v.season } : { seasonYear: v.year }
}

/** 放送時期タグの名前（サーバー側 seasonFrom と同じ） */
export function seasonValueLabel(v: SeasonValue): string | null {
  if (v.year === 'unknown') return '放送時期不明'
  if (v.year === '') return null
  return v.season ? `${v.year}年${SEASON_LABEL[v.season]}` : `${v.year}年`
}

/** works.season_name（"2026-autumn" / "2026" / "unknown"）からタグ名を求める（元の放送時期の判定用） */
export function seasonNameLabel(name: string): string | null {
  if (name === 'unknown') return '放送時期不明'
  if (/^\d{4}$/.test(name)) return `${name}年`
  const m = /^(\d{4})-(winter|spring|summer|autumn)$/.exec(name)
  return m ? `${m[1]}年${SEASON_LABEL[m[2] as Season]}` : null
}

/** 作品が今期の放送作品か */
export function isOnAir(seasonName: string, now: Date = new Date()): boolean {
  return !!seasonName && seasonName === currentSeasonName(now)
}
