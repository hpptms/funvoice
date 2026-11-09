import { Button, Stack, Tooltip } from '@mui/material'
import type { Reaction } from '../../api/client'
import { useRetro } from '../../lib/styleMode'
import { PIXEL_FONT } from '../../theme'

/**
 * コメントへの評価ボタン（＋／－）。押すと評価、もう一度押すと取り消し、反対を押すと切り替え。
 * 自分のコメントは評価できない（サーバー側でも拒否している）。
 */
export default function ReactionButtons({
  plus,
  minus,
  mine,
  isOwnPost,
  disabled,
  onChange,
}: {
  plus: number
  minus: number
  mine: Reaction | null
  isOwnPost: boolean
  disabled?: boolean
  onChange: (next: Reaction | null) => void
}) {
  const retro = useRetro()
  const btn = (value: Reaction, count: number) => {
    const active = mine === value
    const color = value === 1 ? 'primary' : 'secondary'
    const label = value === 1 ? '＋' : '－'
    return (
      <Button
        size="small"
        variant={active ? 'contained' : 'outlined'}
        color={color}
        disabled={disabled || isOwnPost}
        onClick={() => onChange(active ? null : value)}
        aria-pressed={active}
        aria-label={`${value === 1 ? 'プラス' : 'マイナス'} ${count}${active ? '（評価済み）' : ''}`}
        sx={{
          minWidth: { xs: 54, sm: 64 },
          height: 36,
          px: 1.25,
          fontVariantNumeric: 'tabular-nums',
          ...(retro
            ? { borderRadius: 0, borderWidth: 2, fontFamily: PIXEL_FONT, '&:hover': { borderWidth: 2 } }
            : { borderRadius: 999 }),
        }}
      >
        {label} {count}
      </Button>
    )
  }
  const buttons = (
    <Stack direction="row" spacing={{ xs: 0.75, sm: 1 }}>
      {btn(1, plus)}
      {btn(-1, minus)}
    </Stack>
  )
  return isOwnPost ? (
    <Tooltip title="自分のコメントは評価できません">
      <span>{buttons}</span>
    </Tooltip>
  ) : (
    buttons
  )
}
