import { useMe } from './auth'

/**
 * 広告を出してよいか。サポーター（サブスクリプション中）には出さない。
 * ログイン状態の読み込み中（undefined）も出さない（サポーターに一瞬だけ広告が見えるのを防ぐ）。
 *
 * 広告を導入するときは、広告の読み込み（スクリプトの挿入など）をすべてこの判定の内側で行うこと。
 * サポーターの画面では広告のスクリプト自体を読み込まない（表示を隠すだけにしない）。
 */
export function useShowAds(): boolean {
  const me = useMe()
  if (me === undefined) return false
  return !me?.premium
}
