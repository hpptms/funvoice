import type { ReactNode } from 'react'
import { useShowAds } from '../../lib/ads'

/**
 * 広告枠。サポーターには何も表示しない（広告のスクリプトも読み込まない）。
 * 広告の導入時に、children に広告ユニットのコンポーネントを入れて使う。
 * 例: <AdSlot><SomeAdUnit slot="works-list" /></AdSlot>
 */
export default function AdSlot({ children }: { children: ReactNode }) {
  return useShowAds() ? <>{children}</> : null
}
