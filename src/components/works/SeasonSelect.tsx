import { MenuItem, Stack, TextField } from '@mui/material'
import { useState } from 'react'
import { SEASON_LABEL, type Season } from '../../api/client'
import type { SeasonValue } from '../../lib/season'

const SEASONS: Season[] = ['winter', 'spring', 'summer', 'autumn']

/**
 * 放送時期の選択欄（年・季節）。
 *   年: 未設定 / 不明 / 各年
 *   季節: 未選択（1クールか分からない・通年など）/ 冬〜秋。年が不明・未設定のときは選べない
 */
export default function SeasonSelect({
  value,
  onChange,
  allowUnset = true,
  size = 'medium',
}: {
  value: SeasonValue
  onChange: (v: SeasonValue) => void
  /** 年の「未設定」を出すか（作品の追加では任意なので出す、タグの追加では出さない） */
  allowUnset?: boolean
  size?: 'small' | 'medium'
}) {
  const [thisYear] = useState(() => new Date().getFullYear())
  const years = Array.from({ length: thisYear + 2 - 1960 + 1 }, (_, i) => thisYear + 2 - i)
  const yearChosen = typeof value.year === 'number'
  return (
    <Stack direction="row" spacing={1.5} sx={{ width: '100%' }}>
      <TextField
        select
        size={size}
        label="放送年"
        value={value.year}
        onChange={(e) => {
          const v = e.target.value
          const year = v === '' || v === 'unknown' ? v : Number(v)
          onChange({ year, season: typeof year === 'number' ? value.season : '' })
        }}
        sx={{ flex: 1 }}
      >
        {allowUnset && <MenuItem value="">未設定</MenuItem>}
        <MenuItem value="unknown">不明</MenuItem>
        {years.map((y) => (
          <MenuItem key={y} value={y}>
            {y}年
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        size={size}
        label="季節"
        value={value.season}
        disabled={!yearChosen}
        onChange={(e) => onChange({ ...value, season: e.target.value as Season | '' })}
        slotProps={{ select: { displayEmpty: yearChosen }, inputLabel: { shrink: yearChosen || undefined } }}
        sx={{ flex: 1 }}
      >
        <MenuItem value="">未選択</MenuItem>
        {SEASONS.map((s) => (
          <MenuItem key={s} value={s}>
            {SEASON_LABEL[s]}
          </MenuItem>
        ))}
      </TextField>
    </Stack>
  )
}
