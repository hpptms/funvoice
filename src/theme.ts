import '@fontsource/dotgothic16/400.css'
import '@fontsource/m-plus-1-code/400.css'
import '@fontsource/m-plus-1-code/700.css'
import { createTheme, type Theme } from '@mui/material'
import type { StyleMode } from './lib/styleMode'

// 見出し・ボタンはドット文字、本文は等幅。どちらもnpmパッケージで同梱しているのでオフラインでも表示できる
export const PIXEL_FONT = '"DotGothic16", "M PLUS 1 Code", monospace'
export const MONO_FONT = '"M PLUS 1 Code", "Osaka-Mono", "MS Gothic", monospace'

export const SIMPLE_FONT = '"Hiragino Sans", "Noto Sans JP", "Yu Gothic UI", "Meiryo", system-ui, sans-serif'

/** 表示スタイルごとのテーマ。OSのダークモード設定には連動せず、スタイルごとに配色は1つ */
export function createAppTheme(mode: StyleMode): Theme {
  return mode === 'simple' ? simpleTheme : retroTheme
}

// レトロ: 生成り色の紙に黒インクの、レトロPCのウィンドウ風
// 赤紫=続編希望、シアン=キレイに終わった の意味はどちらのスタイルでも同じ
const retroTheme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#d4005c' },
        secondary: { main: '#00739e' },
        success: { main: '#0f7a35' },
        warning: { main: '#b35c00' },
        background: { default: '#ecebe3', paper: '#fbfaf4' },
        text: { primary: '#141414', secondary: '#5a574d' },
        divider: '#141414',
      },
    },
  },
  typography: {
    fontFamily: MONO_FONT,
    fontSize: 14,
    h1: { fontFamily: PIXEL_FONT, fontWeight: 400 },
    h2: { fontFamily: PIXEL_FONT, fontWeight: 400 },
    h3: { fontFamily: PIXEL_FONT, fontWeight: 400 },
    h4: { fontFamily: PIXEL_FONT, fontWeight: 400 },
    h5: { fontFamily: PIXEL_FONT, fontWeight: 400 },
    h6: { fontFamily: PIXEL_FONT, fontWeight: 400 },
    subtitle1: { fontFamily: PIXEL_FONT },
    subtitle2: { fontFamily: PIXEL_FONT },
    button: { fontFamily: PIXEL_FONT, textTransform: 'none', letterSpacing: '0.04em' },
  },
  shape: { borderRadius: 0 },
  components: {
    MuiCssBaseline: {
      styleOverrides: (theme) => ({
        body: {
          // 方眼紙の背景
          backgroundImage: `linear-gradient(${grid(theme)} 1px, transparent 1px), linear-gradient(90deg, ${grid(theme)} 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
          backgroundAttachment: 'fixed',
        },
        '::selection': {
          background: theme.vars!.palette.primary.main,
          color: theme.vars!.palette.primary.contrastText,
        },
        '@keyframes fv-blink': { '50%': { opacity: 0 } },
      }),
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: ({ theme }) => ({
          border: `2px solid ${ink(theme)}`,
          boxShadow: `4px 4px 0 ${ink(theme)}`,
        }),
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { borderRadius: 0 },
        contained: ({ theme }) => ({
          border: `2px solid ${ink(theme)}`,
          boxShadow: `3px 3px 0 ${ink(theme)}`,
          '&:active': { transform: 'translate(3px, 3px)', boxShadow: 'none' },
        }),
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontFamily: PIXEL_FONT,
          borderRadius: 0,
          border: `2px solid ${ink(theme)}`,
          color: theme.vars!.palette.text.primary,
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 0,
          fontFamily: MONO_FONT,
          border: `1px solid ${ink(theme)}`,
          // タッチ端末では押せるタグを押しやすい高さにする
          '@media (pointer: coarse)': { '&.MuiChip-clickable': { height: 38 } },
        }),
        filled: ({ theme }) => ({ backgroundColor: theme.vars!.palette.background.paper }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars!.palette.background.paper,
          '& .MuiOutlinedInput-notchedOutline': { border: `2px solid ${ink(theme)}` },
        }),
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: ({ theme }) => ({ border: `2px solid ${ink(theme)}`, fontFamily: MONO_FONT }),
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: ({ theme }) => ({ border: `2px solid ${ink(theme)}`, boxShadow: `4px 4px 0 ${ink(theme)}` }),
        groupLabel: ({ theme }) => ({
          fontFamily: PIXEL_FONT,
          backgroundColor: ink(theme),
          color: theme.vars!.palette.background.paper,
          lineHeight: '28px',
        }),
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: ({ theme }) => ({ border: `2px solid ${ink(theme)}`, boxShadow: `4px 4px 0 ${ink(theme)}` }),
      },
    },
    // タグ追加などのポップアップも、後ろのカードと区別できるよう太枠と影を付ける
    MuiPopover: {
      styleOverrides: {
        paper: ({ theme }) => ({ border: `2px solid ${ink(theme)}`, boxShadow: `4px 4px 0 ${ink(theme)}` }),
      },
    },
    MuiPaginationItem: {
      styleOverrides: { root: { borderRadius: 0, fontFamily: PIXEL_FONT } },
    },
  },
})

// シンプル: 普通のフォント・角丸・柔らかい影
// シンプル: 淡い水色〜ライトグリーンを基調に、白が強くならないようにした落ち着いた配色
export const SIMPLE_BG_GRADIENT = 'linear-gradient(160deg, #e3f1fa 0%, #e8f5f2 50%, #e5f5e6 100%)'

const simpleTheme = createTheme({
  cssVariables: true,
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#d9406c' }, // 続編希望
        secondary: { main: '#2b78bf' }, // キレイに終わった
        success: { main: '#2e9b6a' },
        background: { default: '#e8f4f4', paper: '#f6fbfa' }, // 純白ではなく、ほんのり緑がかった白
        text: { primary: '#1f3a40', secondary: '#56727a' },
        divider: 'rgba(46, 104, 112, 0.16)',
        action: { hover: 'rgba(46, 120, 130, 0.07)', selected: 'rgba(46, 140, 120, 0.12)' },
      },
    },
  },
  typography: {
    fontFamily: SIMPLE_FONT,
    fontSize: 14,
    h4: { fontWeight: 700 },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 700 },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: { backgroundImage: SIMPLE_BG_GRADIENT, backgroundAttachment: 'fixed' },
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: { root: { backgroundImage: 'none' } },
    },
    MuiCard: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: ({ theme }) => ({
          borderColor: theme.vars!.palette.divider,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
        }),
      },
    },
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiToggleButton: {
      styleOverrides: { root: ({ theme }) => ({ fontWeight: 700, color: theme.vars!.palette.text.primary }) },
    },
    MuiChip: {
      styleOverrides: {
        root: { '@media (pointer: coarse)': { '&.MuiChip-clickable': { height: 38 } } },
        // タグなどの地は薄いミントグリーン
        filled: { backgroundColor: 'rgba(46, 155, 120, 0.12)', '&.MuiChip-clickable:hover': { backgroundColor: 'rgba(46, 155, 120, 0.2)' } },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({ backgroundColor: theme.vars!.palette.background.paper }),
      },
    },
    MuiAutocomplete: {
      styleOverrides: { groupLabel: { fontWeight: 700, lineHeight: '30px' } },
    },
  },
})

/** 枠線・影の色（ライト=黒、ダーク=緑がかった線） */
function ink(theme: Theme) {
  return theme.vars!.palette.divider
}

function grid(theme: Theme) {
  return `color-mix(in srgb, ${theme.vars!.palette.divider} 9%, transparent)`
}
