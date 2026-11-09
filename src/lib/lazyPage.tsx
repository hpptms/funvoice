import { lazy, type ComponentType } from 'react'

// あまり開かれないページを、開いたときに読み込む（最初に読み込むJSを減らす）。
// React.lazy だけだと、そのページへ直接アクセスしたときに一瞬中身が消える
// （SEO用に埋め込んだ本文 → 読み込み中の空白 → ページ）ので、preload() で描画前に読み込めるようにしている。
// preload 済みなら通常のコンポーネントとして同期的に描画する。
export function lazyPage<P extends object>(load: () => Promise<{ default: ComponentType<P> }>) {
  let loaded: ComponentType<P> | null = null
  const preload = () =>
    load().then((m) => {
      loaded = m.default
      return m
    })
  const Lazy = lazy(preload)
  function Page(props: P) {
    const C = loaded
    return C ? <C {...props} /> : <Lazy {...props} />
  }
  return Object.assign(Page, { preload })
}
