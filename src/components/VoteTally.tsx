import { Box, Stack, Typography } from '@mui/material'
import type { ChoiceCount, Tally } from '../api/client'
import { useRetro } from '../lib/styleMode'
import { PIXEL_FONT } from '../theme'

function percent(c: ChoiceCount) {
  const total = c.sequel + c.complete
  return total === 0 ? null : Math.round((c.sequel / total) * 100)
}

/** ブロックを並べたようなドット風の塗り */
const blocks = (color: string) => `repeating-linear-gradient(90deg, ${color} 0 6px, transparent 6px 8px)`

/**
 * 続編希望（左）とキレイに終わった（右）の割合バー。
 * レトロ: ブロックが並ぶプログレスバー風 / シンプル: 角丸のなめらかなバー
 */
export function TallyBar({ count, height = 12 }: { count: ChoiceCount; height?: number }) {
  const p = percent(count)
  const retro = useRetro()
  const label = p === null ? 'まだ投票がありません' : `続編希望 ${count.sequel}票、キレイに終わった ${count.complete}票`
  if (!retro) {
    return (
      <Box
        sx={{ display: 'flex', height: height - 2, borderRadius: 99, overflow: 'hidden', bgcolor: 'action.hover', gap: '2px' }}
        role="img"
        aria-label={label}
      >
        {p !== null && (
          <>
            {p > 0 && <Box sx={{ width: `${p}%`, bgcolor: 'primary.main', transition: 'width .3s' }} />}
            {p < 100 && <Box sx={{ flex: 1, bgcolor: 'secondary.main' }} />}
          </>
        )}
      </Box>
    )
  }
  return (
    <Box
      sx={{ display: 'flex', height: height + 8, p: '2px', border: 2, borderColor: 'divider', gap: '2px' }}
      role="img"
      aria-label={label}
    >
      {p !== null && (
        <>
          <Box sx={{ width: `${p}%`, background: (t) => blocks(t.vars!.palette.primary.main), transition: 'width .3s' }} />
          <Box sx={{ flex: 1, background: (t) => blocks(t.vars!.palette.secondary.main) }} />
        </>
      )}
    </Box>
  )
}

function Row({ label, count, note }: { label: string; count: ChoiceCount; note?: string }) {
  const p = percent(count)
  const total = count.sequel + count.complete
  const retro = useRetro()
  return (
    <Box>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'baseline', mb: 0.5 }}>
        <Typography sx={retro ? { fontFamily: PIXEL_FONT, fontSize: 15 } : { fontWeight: 700, fontSize: 15 }}>
          {label}
          {note && (
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
              {retro ? `// ${note}` : `（${note}）`}
            </Typography>
          )}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {retro ? `n=${total}` : `${total}票`}
        </Typography>
      </Stack>
      <TallyBar count={count} height={retro ? 14 : 12} />
      <Stack
        direction="row"
        sx={{ justifyContent: 'space-between', mt: 0.5, flexWrap: 'wrap', columnGap: 1, fontSize: 13, fontWeight: retro ? 400 : 700 }}
      >
        <Box sx={{ color: 'primary.main' }}>
          続編希望 {count.sequel}
          {p !== null && ` (${p}%)`}
        </Box>
        <Box sx={{ color: 'secondary.main' }}>
          {p !== null && `(${100 - p}%) `}
          {count.complete} キレイに終わった
        </Box>
      </Stack>
    </Box>
  )
}

/** 合計・登録ユーザー・匿名 の3段で集計を表示 */
export default function VoteTally({ tally }: { tally: Tally }) {
  return (
    <Stack spacing={2.5}>
      <Row label="合計" count={tally.total} />
      <Row label="登録ユーザー" count={tally.registered} note="1アカウント1票" />
      <Row label="匿名" count={tally.anonymous} note="回線・ブラウザ単位で1票" />
    </Stack>
  )
}
