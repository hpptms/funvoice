import { Box, Card, CardContent, Typography, type SxProps, type Theme } from '@mui/material'
import type { ReactNode } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { useRetro } from '../lib/styleMode'
import { PIXEL_FONT } from '../theme'

/** 点滅するブロックカーソル █（レトロモードのみ） */
export function Cursor() {
  if (!useRetro()) return null
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: 'inline-block',
        width: '0.6em',
        height: '1em',
        ml: 0.5,
        verticalAlign: '-0.12em',
        bgcolor: 'success.main',
        animation: 'fv-blink 1s steps(1) infinite',
        '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
      }}
    />
  )
}

/** "$ ls ./tags" のようなプロンプト行（レトロモードのみ） */
export function Prompt({ children }: { children: ReactNode }) {
  if (!useRetro()) return null
  return (
    <Box component="div" sx={{ color: 'text.secondary', fontSize: 13, mb: 0.5 }}>
      <Box component="span" sx={{ color: 'success.main' }}>
        fanvoice@anime
      </Box>
      :~$ {children}
    </Box>
  )
}

/** 昔のOS風のタイトルバー（_ □ × 付き）。飾りなのでボタンは押せない */
export function TitleBar({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1,
        minHeight: 26,
        bgcolor: 'divider',
        color: 'background.paper',
        fontFamily: PIXEL_FONT,
        fontSize: 13,
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      <Box component="span" sx={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {children}
      </Box>
      {right}
      <Box component="span" aria-hidden sx={{ display: 'flex', gap: '3px' }}>
        {['_', '□', '×'].map((c) => (
          <Box
            key={c}
            component="span"
            sx={{
              width: 16,
              height: 16,
              display: 'grid',
              placeItems: 'center',
              border: '1px solid',
              borderColor: 'background.paper',
              fontSize: 11,
            }}
          >
            {c}
          </Box>
        ))}
      </Box>
    </Box>
  )
}

/**
 * セクションの枠。
 * レトロ: タイトルバー付きのウィンドウ（"vote.exe — あなたの声"）
 * シンプル: 見出し付きのカード（"あなたの声"）
 */
export function Window({
  title,
  file,
  children,
  sx,
}: {
  title: string
  /** レトロモードでタイトルバーに出すファイル名風の名前 */
  file?: string
  children: ReactNode
  sx?: SxProps<Theme>
}) {
  const retro = useRetro()
  return (
    <Card sx={sx} component="section" aria-label={title}>
      {retro && (
        <TitleBar>
          {/* 見た目はタイトルバーのまま、検索エンジン・読み上げには h2 として伝える */}
          <Box component="h2" sx={{ m: 0, font: 'inherit', color: 'inherit' }}>
            {file && <span aria-hidden="true">{file} — </span>}
            {title}
          </Box>
        </TitleBar>
      )}
      <CardContent>
        {!retro && (
          <Typography variant="h6" component="h2" sx={{ fontSize: 17, mb: 2 }}>
            {title}
          </Typography>
        )}
        {children}
      </CardContent>
    </Card>
  )
}

/**
 * ランキングへの目立つバナー風リンク。
 * レトロ: 昔の個人サイトのバナーのような、ベタ塗り＋太枠＋黒いハード影＋点滅する▶▶
 * シンプル: 色付きの角丸ボタン
 */
export function RankingBanner({
  to,
  color,
  children,
}: {
  to: string
  color: 'primary' | 'secondary'
  children: ReactNode
}) {
  const retro = useRetro()
  const reduced = '@media (prefers-reduced-motion: reduce)'
  return (
    <Box
      component={RouterLink}
      to={to}
      sx={(theme) => ({
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        maxWidth: '100%',
        px: 1.5,
        py: 1,
        textDecoration: 'none',
        color: '#fff',
        bgcolor: `${color}.main`,
        fontWeight: 700,
        fontSize: { xs: 15, sm: 17 },
        lineHeight: 1.3,
        transition: 'transform .08s, box-shadow .08s',
        ...(retro
          ? {
              fontFamily: PIXEL_FONT,
              fontWeight: 400,
              border: '3px solid #141414',
              boxShadow: '5px 5px 0 #141414',
              textShadow: '2px 2px 0 rgba(0,0,0,.45)',
              // 走査線っぽい横縞
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0 2px, transparent 2px 4px)',
              '&:hover, &:focus-visible': { transform: 'translate(2px, 2px)', boxShadow: '3px 3px 0 #141414' },
              '&:active': { transform: 'translate(5px, 5px)', boxShadow: 'none' },
            }
          : {
              borderRadius: 999,
              boxShadow: `0 4px 14px color-mix(in srgb, ${theme.vars!.palette[color].main} 40%, transparent)`,
              '&:hover, &:focus-visible': { transform: 'translateY(-2px)' },
            }),
        '&:focus-visible': { outline: '3px solid #ffe600', outlineOffset: 2 },
      })}
    >
      <Box component="span" sx={{ minWidth: 0 }}>
        {children}
      </Box>
      <Box component="span" aria-hidden sx={{ flexShrink: 0, ...(retro && { animation: 'fv-blink 1s steps(1) infinite', [reduced]: { animation: 'none' } }) }}>
        {retro ? '▶▶' : '›'}
      </Box>
    </Box>
  )
}
