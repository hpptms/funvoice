import { CssBaseline, ThemeProvider } from '@mui/material'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { StyleModeContext, loadStyleMode, saveStyleMode, type StyleMode } from '../lib/styleMode'
import { createAppTheme } from '../theme'
import { applyFonts } from '../fonts'

/** 表示スタイル（レトロ/シンプル）を保持し、対応するテーマを適用する */
export default function StyleModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<StyleMode>(loadStyleMode)
  const theme = useMemo(() => createAppTheme(mode), [mode])

  useEffect(() => {
    document.documentElement.dataset.style = mode
    // スマホのブラウザのアドレスバーなどの色をヘッダーに合わせる
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', mode === 'retro' ? '#141414' : '#e3f1fa')
  }, [mode])

  const value = useMemo(
    () => ({
      mode,
      setMode: (m: StyleMode) => {
        // シンプル表示から切り替えたときは、レトロ表示のフォントをここで読み込む
        if (m === 'retro') void applyFonts()
        setModeState(m)
        saveStyleMode(m)
      },
    }),
    [mode],
  )

  return (
    <StyleModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </StyleModeContext.Provider>
  )
}
