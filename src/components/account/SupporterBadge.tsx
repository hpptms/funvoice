import StarRoundedIcon from '@mui/icons-material/StarRounded'
import { Box, Chip } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { useRetro } from '../../lib/styleMode'
import { PIXEL_FONT } from '../../theme'

/** バッジの色（金色）。文字は濃い色にして、明るい背景・暗い背景のどちらでも読める（#1a1a1a に対して約 9:1） */
const GOLD = '#F2B705'
const INK = '#1a1a1a'

export const SUPPORTER_LABEL = 'サポーター'

/**
 * サポーター（サブスクリプション中のユーザー）のバッジ。
 * - 通常: 「★サポーター」のチップ（コメント欄・マイページ）
 * - compact: ★だけ（ヘッダーなど幅の狭いところ）。読み上げでは「サポーター」と読む
 * - link: 押すとサポーターの案内ページへ（コメント欄。サブスクリプションがあることを知ってもらうため）
 */
export default function SupporterBadge({ compact = false, link = false }: { compact?: boolean; link?: boolean }) {
  const retro = useRetro()
  if (compact) {
    return (
      <Box
        component="span"
        role="img"
        aria-label={SUPPORTER_LABEL}
        title={SUPPORTER_LABEL}
        sx={{ display: 'inline-grid', placeItems: 'center', color: GOLD, flexShrink: 0 }}
      >
        <StarRoundedIcon sx={{ fontSize: 18 }} />
      </Box>
    )
  }
  return (
    <Chip
      icon={<StarRoundedIcon />}
      label={SUPPORTER_LABEL}
      size="small"
      title="サブスクリプションでサイトを応援しているユーザー"
      {...(link ? { component: RouterLink, to: '/supporter', clickable: true } : {})}
      sx={{
        height: 20,
        fontSize: 11,
        fontWeight: 700,
        bgcolor: GOLD,
        color: INK,
        border: 0,
        borderRadius: retro ? 0 : undefined,
        '& .MuiChip-icon': { color: INK, fontSize: 14, ml: 0.5, mr: -0.25 },
        '& .MuiChip-label': { px: 0.75 },
        '&.MuiChip-clickable:hover': { bgcolor: '#FFC933' },
        ...(retro ? { fontFamily: PIXEL_FONT } : {}),
      }}
    />
  )
}
