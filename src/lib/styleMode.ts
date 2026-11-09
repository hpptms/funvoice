import { createContext, useContext } from 'react'

/** 表示スタイル。ライト/ダークとは別軸で、どちらのスタイルでもOSの設定に合わせてライト/ダークが切り替わる */
export type StyleMode = 'retro' | 'simple'

const STORAGE_KEY = 'fv_style'
export const DEFAULT_STYLE_MODE: StyleMode = 'retro'

export function loadStyleMode(): StyleMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'simple' || v === 'retro' ? v : DEFAULT_STYLE_MODE
  } catch {
    return DEFAULT_STYLE_MODE // プライベートブラウズなどでストレージが使えない場合
  }
}

export function saveStyleMode(mode: StyleMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* 保存できなくても切り替え自体はできる */
  }
}

export const StyleModeContext = createContext<{ mode: StyleMode; setMode: (m: StyleMode) => void }>({
  mode: DEFAULT_STYLE_MODE,
  setMode: () => {},
})

export const useStyleMode = () => useContext(StyleModeContext)

/** レトロモードなら true。表示する文言・部品を切り替えるのに使う */
export const useRetro = () => useStyleMode().mode === 'retro'
