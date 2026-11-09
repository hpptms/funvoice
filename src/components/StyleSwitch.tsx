import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import TerminalIcon from '@mui/icons-material/Terminal'
import { ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useStyleMode, type StyleMode } from '../lib/styleMode'
import { PIXEL_FONT } from '../theme'

/**
 * レトロ / シンプル の切換えボタン。ヘッダー右上に常に表示する。
 * スマホでも押しやすいよう高さ40px。選択中のほうを塗りつぶして、今どちらかが一目でわかるようにしている。
 */
export default function StyleSwitch() {
  const { mode, setMode } = useStyleMode()
  const retro = mode === 'retro'

  return (
    <ToggleButtonGroup
      exclusive
      size="small"
      value={mode}
      onChange={(_, v: StyleMode | null) => v && setMode(v)}
      aria-label="表示スタイルの切り替え"
      sx={{
        flexShrink: 0,
        '& .MuiToggleButton-root': {
          height: 40,
          px: { xs: 1, sm: 1.5 },
          gap: 0.5,
          fontSize: { xs: 12, sm: 13 },
          whiteSpace: 'nowrap',
          lineHeight: 1,
          // スマホ幅ではヘッダーに収まるようアイコンを隠して文字だけにする
          '& .MuiSvgIcon-root': { display: { xs: 'none', sm: 'inline-block' } },
          ...(retro
            ? {
                // 黒いヘッダーの上に置くので、ヘッダーの文字色をそのまま使う
                fontFamily: PIXEL_FONT,
                color: 'inherit',
                borderColor: 'currentColor',
                borderWidth: 1,
                '&.Mui-selected, &.Mui-selected:hover': { bgcolor: 'primary.main', color: 'primary.contrastText' },
              }
            : {
                borderRadius: 999,
                '&.Mui-selected, &.Mui-selected:hover': { bgcolor: 'text.primary', color: 'background.paper' },
              }),
        },
      }}
    >
      <ToggleButton value="retro" aria-label="レトロモード">
        <TerminalIcon sx={{ fontSize: 18 }} />
        レトロ
      </ToggleButton>
      <ToggleButton value="simple" aria-label="シンプルモード">
        <AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} />
        シンプル
      </ToggleButton>
    </ToggleButtonGroup>
  )
}
